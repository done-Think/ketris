import { randomBytes } from 'node:crypto'
import { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'
import { normalizeEmail } from '@server/shared/normalize-email'
import { buildPublicProfileSlug } from '@shared/utils/public-profile-slug'

import type { RegistrationRepository } from '../application/ports/registration-repository.port'
import {
  RegistrationEmailAlreadyInUseError,
  RenterTenantNotConfiguredError,
} from '../domain/errors'
import { assertAgencyCanReceiveMembers } from '../domain/registration-policy'
import type {
  NewRegistrationMember,
  NewTenantWithAdmin,
  RegistrationAccount,
  RegistrationTenant,
} from '../types/account'

const MAX_SLUG_ATTEMPTS = 5
const tenantSelect = {
  id: true,
  nome: true,
  slug: true,
  accountType: true,
  status: true,
  createdAt: true,
} as const

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

export class PrismaRegistrationRepository implements RegistrationRepository {
  async createTenantWithAdmin(
    input: NewTenantWithAdmin,
  ): Promise<{ tenant: RegistrationTenant; user: RegistrationAccount }> {
    const baseSlug = buildPublicProfileSlug(input.tenantName) || 'tenant'

    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
      const slug = attempt === 0 ? baseSlug : `${baseSlug}-${randomBytes(6).toString('hex')}`
      let tenantSlugConflict = false
      try {
        return await prisma.$transaction(async (transaction) => {
          const tenant = await transaction.tenant
            .create({
              data: {
                nome: input.tenantName,
                slug,
                accountType: input.accountType,
                status: input.status,
              },
              select: tenantSelect,
            })
            .catch((error: unknown) => {
              tenantSlugConflict = isUniqueConflict(error)
              throw error
            })
          const user = await transaction.usuario
            .create({
              data: {
                tenantId: tenant.id,
                nome: input.adminName,
                email: normalizeEmail(input.email),
                senhaHash: input.senhaHash,
                papel: 'OWNER',
                telefone: input.telefone,
                creci: input.creci,
                termosAceitosEm: input.termosAceitosEm,
                emailVerificadoEm: null,
              },
              select: { id: true, tenantId: true, email: true },
            })
            .catch((error: unknown) => {
              if (isUniqueConflict(error)) throw new RegistrationEmailAlreadyInUseError()
              throw error
            })
          await transaction.userAuditEvent.create({
            data: {
              userId: user.id,
              tenantId: tenant.id,
              action: 'CREATED',
              actorType: 'SELF_REGISTRATION',
              actorUserId: user.id,
              changedFields: [],
            },
          })
          if (input.createBrokerProfile) {
            await transaction.perfilPublicoCorretor.create({
              data: {
                usuarioId: user.id,
                displayName: input.adminName,
                telefone: input.telefone,
                creci: input.creci,
                status: 'DRAFT',
              },
            })
          }
          return { tenant, user }
        })
      } catch (error) {
        if (!tenantSlugConflict || attempt === MAX_SLUG_ATTEMPTS - 1) throw error
      }
    }
    throw new Error('Não foi possível criar o identificador da conta.')
  }

  async createMember(input: NewRegistrationMember): Promise<RegistrationAccount> {
    return prisma.$transaction(async (transaction) => {
      const [tenant] = await transaction.$queryRaw<RegistrationTenant[]>`
        SELECT "id", "nome", "slug", "accountType", "status", "createdAt"
        FROM "tenants" WHERE "id" = ${input.tenantId} FOR SHARE
      `
      if (input.papel === 'AGENT') assertAgencyCanReceiveMembers(tenant ?? null)
      else if (!tenant) throw new RenterTenantNotConfiguredError()

      const user = await transaction.usuario
        .create({
          data: {
            tenantId: input.tenantId,
            nome: input.nome,
            email: normalizeEmail(input.email),
            senhaHash: input.senhaHash,
            papel: input.papel,
            telefone: input.telefone,
            creci: input.creci,
            termosAceitosEm: input.termosAceitosEm,
            emailVerificadoEm: null,
            vinculoAprovadoEm: input.pendingApproval ? null : new Date(),
          },
          select: { id: true, tenantId: true, email: true },
        })
        .catch((error: unknown) => {
          if (isUniqueConflict(error)) throw new RegistrationEmailAlreadyInUseError()
          throw error
        })
      await transaction.userAuditEvent.create({
        data: {
          userId: user.id,
          tenantId: input.tenantId,
          action: 'CREATED',
          actorType: 'SELF_REGISTRATION',
          actorUserId: user.id,
          changedFields: [],
        },
      })
      if (input.createBrokerProfile) {
        await transaction.perfilPublicoCorretor.create({
          data: {
            usuarioId: user.id,
            displayName: input.nome,
            telefone: input.telefone,
            creci: input.creci,
            status: 'DRAFT',
          },
        })
      }
      return user
    })
  }

  findAccountByEmail(tenantId: string, email: string): Promise<RegistrationAccount | null> {
    return prisma.usuario.findUnique({
      where: { tenantId_email: { tenantId, email: normalizeEmail(email) } },
      select: { id: true, tenantId: true, email: true },
    })
  }

  findTenantById(id: string): Promise<RegistrationTenant | null> {
    return prisma.tenant.findUnique({ where: { id }, select: tenantSelect })
  }

  findTenantBySlug(slug: string): Promise<RegistrationTenant | null> {
    return prisma.tenant.findUnique({ where: { slug }, select: tenantSelect })
  }

  searchByName(query: string, excludeSlugs: string[]): Promise<RegistrationTenant[]> {
    return prisma.tenant.findMany({
      where: {
        nome: { contains: query, mode: 'insensitive' },
        slug: { notIn: excludeSlugs },
        accountType: 'AGENCY',
        status: { in: ['ACTIVE', 'TRIAL'] },
      },
      orderBy: { nome: 'asc' },
      take: 20,
      select: tenantSelect,
    })
  }
}

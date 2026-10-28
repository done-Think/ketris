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
  name: true,
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
                name: input.tenantName,
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
          const user = await transaction.user
            .create({
              data: {
                tenantId: tenant.id,
                name: input.adminName,
                email: normalizeEmail(input.email),
                passwordHash: input.passwordHash,
                role: 'OWNER',
                phone: input.phone,
                creci: input.creci,
                termsAcceptedAt: input.termsAcceptedAt,
                emailVerifiedAt: null,
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
            await transaction.brokerPublicProfile.create({
              data: {
                userId: user.id,
                displayName: input.adminName,
                phone: input.phone,
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
        SELECT "id", "name", "slug", "accountType", "status", "createdAt"
        FROM "tenants" WHERE "id" = ${input.tenantId} FOR SHARE
      `
      if (input.role === 'AGENT') assertAgencyCanReceiveMembers(tenant ?? null)
      else if (!tenant) throw new RenterTenantNotConfiguredError()

      const user = await transaction.user
        .create({
          data: {
            tenantId: input.tenantId,
            name: input.name,
            email: normalizeEmail(input.email),
            passwordHash: input.passwordHash,
            role: input.role,
            phone: input.phone,
            creci: input.creci,
            termsAcceptedAt: input.termsAcceptedAt,
            emailVerifiedAt: null,
            membershipApprovedAt: input.pendingApproval ? null : new Date(),
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
        await transaction.brokerPublicProfile.create({
          data: {
            userId: user.id,
            displayName: input.name,
            phone: input.phone,
            creci: input.creci,
            status: 'DRAFT',
          },
        })
      }
      return user
    })
  }

  findAccountByEmail(tenantId: string, email: string): Promise<RegistrationAccount | null> {
    return prisma.user.findUnique({
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
        name: { contains: query, mode: 'insensitive' },
        slug: { notIn: excludeSlugs },
        accountType: 'AGENCY',
        status: { in: ['ACTIVE', 'TRIAL'] },
      },
      orderBy: { name: 'asc' },
      take: 20,
      select: tenantSelect,
    })
  }
}

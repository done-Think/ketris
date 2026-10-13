import { randomBytes } from 'node:crypto'

import { prisma } from '@server/db/prisma'
import type { User } from '@server/auth/domain/user.entity'
import { normalizeEmail } from '@server/shared/normalize-email'
import type { TenantSummary } from '@server/platform/domain/tenant-summary.entity'

import type {
  NewTenantWithAdmin,
  RegistrationRepository,
} from '../application/ports/registration-repository.port'

const MAX_SLUG_ATTEMPTS = 5

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function generateUniqueSlug(tenantName: string): Promise<string> {
  const base = slugify(tenantName) || 'tenant'

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${randomBytes(3).toString('hex')}`
    const existing = await prisma.tenant.findUnique({ where: { slug: candidate } })

    if (!existing) return candidate
  }

  return `${base}-${randomBytes(6).toString('hex')}`
}

export class PrismaRegistrationRepository implements RegistrationRepository {
  async createTenantWithAdmin(
    input: NewTenantWithAdmin,
  ): Promise<{ tenant: TenantSummary; user: User }> {
    const slug = await generateUniqueSlug(input.tenantName)

    return prisma.$transaction(async (transaction) => {
      const tenant = await transaction.tenant.create({
        data: { nome: input.tenantName, slug },
      })

      const usuario = await transaction.usuario.create({
        data: {
          tenantId: tenant.id,
          nome: input.adminName,
          email: normalizeEmail(input.email),
          senhaHash: input.senhaHash,
          papel: 'ADMIN',
        },
      })

      return {
        tenant: {
          id: tenant.id,
          nome: tenant.nome,
          slug: tenant.slug,
          createdAt: tenant.createdAt,
        },
        user: {
          id: usuario.id,
          tenantId: usuario.tenantId,
          nome: usuario.nome,
          email: usuario.email,
          senhaHash: usuario.senhaHash,
          papel: usuario.papel,
          ativo: usuario.ativo,
          vinculoAprovadoEm: usuario.vinculoAprovadoEm,
        },
      }
    })
  }
}

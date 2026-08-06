import { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type {
  BootstrapAdminInput,
  BootstrapAdminRepository,
  BootstrapAdminResult,
} from '../application/ports/bootstrap-admin-repository.port'
import type { User } from '../domain/user.entity'

function toDomainUser(usuario: {
  id: string
  tenantId: string
  nome: string
  email: string
  senhaHash: string
  papel: User['papel']
  ativo: boolean
}): User {
  return {
    id: usuario.id,
    tenantId: usuario.tenantId,
    nome: usuario.nome,
    email: usuario.email,
    senhaHash: usuario.senhaHash,
    papel: usuario.papel,
    ativo: usuario.ativo,
  }
}

export class PrismaBootstrapAdminRepository implements BootstrapAdminRepository {
  async bootstrapFirstAdmin(input: BootstrapAdminInput): Promise<BootstrapAdminResult> {
    try {
      return await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.findUnique({ where: { slug: input.tenantSlug } })

        if (!tenant) {
          return { status: 'tenant_not_found' }
        }

        const claim = await tx.tenant.updateMany({
          where: { id: tenant.id, adminBootstrappedAt: null },
          data: { adminBootstrappedAt: new Date() },
        })

        if (claim.count === 0) {
          return { status: 'admin_already_exists' }
        }

        const usuario = await tx.usuario.create({
          data: {
            tenantId: tenant.id,
            nome: input.nome,
            email: input.email,
            senhaHash: input.senhaHash,
            papel: 'ADMIN',
          },
        })

        return { status: 'created', user: toDomainUser(usuario) }
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return { status: 'email_already_in_use' }
      }

      throw error
    }
  }
}

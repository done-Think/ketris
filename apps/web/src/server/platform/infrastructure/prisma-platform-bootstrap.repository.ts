import { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type {
  BootstrapPlatformAdminInput,
  BootstrapPlatformAdminResult,
  PlatformBootstrapRepository,
} from '../application/ports/platform-bootstrap-repository.port'
import type { PlatformAdmin } from '../domain/platform-admin.entity'

const SINGLETON_ID = 'singleton'

function toDomainPlatformAdmin(admin: {
  id: string
  nome: string
  email: string
  senhaHash: string
  ativo: boolean
}): PlatformAdmin {
  return {
    id: admin.id,
    nome: admin.nome,
    email: admin.email,
    senhaHash: admin.senhaHash,
    ativo: admin.ativo,
  }
}

export class PrismaPlatformBootstrapRepository implements PlatformBootstrapRepository {
  async bootstrapFirstPlatformAdmin(
    input: BootstrapPlatformAdminInput,
  ): Promise<BootstrapPlatformAdminResult> {
    try {
      return await prisma.$transaction(async (tx) => {
        await tx.platformSettings.upsert({
          where: { id: SINGLETON_ID },
          update: {},
          create: { id: SINGLETON_ID, bootstrappedAt: null },
        })

        const claim = await tx.platformSettings.updateMany({
          where: { id: SINGLETON_ID, bootstrappedAt: null },
          data: { bootstrappedAt: new Date() },
        })

        if (claim.count === 0) {
          return { status: 'already_bootstrapped' }
        }

        const admin = await tx.platformAdmin.create({
          data: {
            nome: input.nome,
            email: input.email,
            senhaHash: input.senhaHash,
          },
        })

        return { status: 'created', admin: toDomainPlatformAdmin(admin) }
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return { status: 'email_already_in_use' }
      }

      throw error
    }
  }
}

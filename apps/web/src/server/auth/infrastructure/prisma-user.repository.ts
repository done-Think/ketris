import { prisma } from '@server/db/prisma'

import type { NewUser, UserRepository } from '../application/ports/user-repository.port'
import type { User } from '../domain/user.entity'

function toDomainUser(usuario: {
  id: string
  tenantId: string
  nome: string
  email: string
  senhaHash: string
  papel: User['papel']
}): User {
  return {
    id: usuario.id,
    tenantId: usuario.tenantId,
    nome: usuario.nome,
    email: usuario.email,
    senhaHash: usuario.senhaHash,
    papel: usuario.papel,
  }
}

export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const usuario = await prisma.usuario.findFirst({ where: { email } })

    return usuario ? toDomainUser(usuario) : null
  }

  async findByEmailAndTenant(tenantId: string, email: string): Promise<User | null> {
    const usuario = await prisma.usuario.findUnique({
      where: { tenantId_email: { tenantId, email } },
    })

    return usuario ? toDomainUser(usuario) : null
  }

  async create(newUser: NewUser): Promise<User> {
    const usuario = await prisma.usuario.create({
      data: {
        tenantId: newUser.tenantId,
        nome: newUser.nome,
        email: newUser.email,
        senhaHash: newUser.senhaHash,
        papel: newUser.papel,
      },
    })

    return toDomainUser(usuario)
  }
}

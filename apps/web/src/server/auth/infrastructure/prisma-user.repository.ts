import { prisma } from '@server/db/prisma'

import type { NewUser, UserRepository, UserUpdate } from '../application/ports/user-repository.port'
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

export class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const usuario = await prisma.usuario.findUnique({ where: { id } })

    return usuario ? toDomainUser(usuario) : null
  }

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

  async findManyByTenant(tenantId: string): Promise<User[]> {
    const usuarios = await prisma.usuario.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    })

    return usuarios.map(toDomainUser)
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

  async update(id: string, changes: UserUpdate): Promise<User> {
    const usuario = await prisma.usuario.update({
      where: { id },
      data: {
        nome: changes.nome,
        email: changes.email,
        papel: changes.papel,
      },
    })

    return toDomainUser(usuario)
  }

  async deactivate(id: string): Promise<User> {
    const usuario = await prisma.usuario.update({
      where: { id },
      data: { ativo: false },
    })

    return toDomainUser(usuario)
  }
}

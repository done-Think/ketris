import { prisma } from '@server/db/prisma'

import type { UserRepository } from '../application/ports/user-repository.port'
import type { User } from '../domain/user.entity'

export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const usuario = await prisma.usuario.findFirst({ where: { email } })

    if (!usuario) return null

    return {
      id: usuario.id,
      tenantId: usuario.tenantId,
      nome: usuario.nome,
      email: usuario.email,
      senhaHash: usuario.senhaHash,
      papel: usuario.papel,
    }
  }
}

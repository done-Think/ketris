import type { PlatformAdmin as PrismaPlatformAdmin } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type { PlatformAdminRepository } from '../application/ports/platform-admin-repository.port'
import type { NewPlatformAdmin, PlatformAdminUpdate } from '../types/platform-admin-repository'
import type { PlatformAdmin } from '../types/platform-admin'

function toDomainPlatformAdmin(admin: PrismaPlatformAdmin): PlatformAdmin {
  return {
    id: admin.id,
    nome: admin.nome,
    email: admin.email,
    senhaHash: admin.senhaHash,
    role: admin.role,
    ativo: admin.ativo,
    createdAt: admin.createdAt,
    ultimoAcessoEm: admin.ultimoAcessoEm,
  }
}

export class PrismaPlatformAdminRepository implements PlatformAdminRepository {
  async findById(id: string): Promise<PlatformAdmin | null> {
    const admin = await prisma.platformAdmin.findUnique({ where: { id } })

    return admin ? toDomainPlatformAdmin(admin) : null
  }

  async findByEmail(email: string): Promise<PlatformAdmin | null> {
    const admin = await prisma.platformAdmin.findUnique({ where: { email } })

    return admin ? toDomainPlatformAdmin(admin) : null
  }

  async findMany(): Promise<PlatformAdmin[]> {
    const admins = await prisma.platformAdmin.findMany({ orderBy: { createdAt: 'asc' } })

    return admins.map(toDomainPlatformAdmin)
  }

  async create(newAdmin: NewPlatformAdmin): Promise<PlatformAdmin> {
    const admin = await prisma.platformAdmin.create({
      data: {
        nome: newAdmin.nome,
        email: newAdmin.email,
        senhaHash: newAdmin.senhaHash,
        role: newAdmin.role,
      },
    })

    return toDomainPlatformAdmin(admin)
  }

  async update(id: string, changes: PlatformAdminUpdate): Promise<PlatformAdmin | null> {
    const { count } = await prisma.platformAdmin.updateMany({
      where: { id },
      data: {
        nome: changes.nome,
        email: changes.email,
        role: changes.role,
        ativo: changes.ativo,
      },
    })

    return count ? this.findById(id) : null
  }

  async deactivate(id: string): Promise<PlatformAdmin | null> {
    const { count } = await prisma.platformAdmin.updateMany({
      where: { id },
      data: { ativo: false },
    })

    return count ? this.findById(id) : null
  }

  async recordAccess(id: string, at: Date): Promise<void> {
    await prisma.platformAdmin.updateMany({ where: { id }, data: { ultimoAcessoEm: at } })
  }
}

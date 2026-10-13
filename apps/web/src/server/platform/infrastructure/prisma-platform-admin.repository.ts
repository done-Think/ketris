import { prisma } from '@server/db/prisma'

import type {
  NewPlatformAdmin,
  PlatformAdminRepository,
  PlatformAdminUpdate,
} from '../application/ports/platform-admin-repository.port'
import type { PlatformAdmin, PlatformAdminRole } from '../domain/platform-admin.entity'

function toDomainPlatformAdmin(admin: {
  id: string
  nome: string
  email: string
  senhaHash: string
  role: PlatformAdminRole
  ativo: boolean
}): PlatformAdmin {
  return {
    id: admin.id,
    nome: admin.nome,
    email: admin.email,
    senhaHash: admin.senhaHash,
    role: admin.role,
    ativo: admin.ativo,
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

  async update(id: string, changes: PlatformAdminUpdate): Promise<PlatformAdmin> {
    const admin = await prisma.platformAdmin.update({
      where: { id },
      data: {
        nome: changes.nome,
        email: changes.email,
        role: changes.role,
        ativo: changes.ativo,
      },
    })

    return toDomainPlatformAdmin(admin)
  }

  async deactivate(id: string): Promise<PlatformAdmin> {
    const admin = await prisma.platformAdmin.update({
      where: { id },
      data: { ativo: false },
    })

    return toDomainPlatformAdmin(admin)
  }
}

import { prisma } from '@server/db/prisma'

import type { NewTenant, TenantRepository } from '../application/ports/tenant-repository.port'
import type { TenantSummary } from '../domain/tenant-summary.entity'

function toDomainTenantSummary(tenant: {
  id: string
  nome: string
  slug: string
  createdAt: Date
}): TenantSummary {
  return {
    id: tenant.id,
    nome: tenant.nome,
    slug: tenant.slug,
    createdAt: tenant.createdAt,
  }
}

export class PrismaTenantRepository implements TenantRepository {
  async findBySlug(slug: string): Promise<TenantSummary | null> {
    const tenant = await prisma.tenant.findUnique({ where: { slug } })

    return tenant ? toDomainTenantSummary(tenant) : null
  }

  async findById(id: string): Promise<TenantSummary | null> {
    const tenant = await prisma.tenant.findUnique({ where: { id } })

    return tenant ? toDomainTenantSummary(tenant) : null
  }

  async findMany(): Promise<TenantSummary[]> {
    const tenants = await prisma.tenant.findMany({ orderBy: { createdAt: 'asc' } })

    return tenants.map(toDomainTenantSummary)
  }

  async create(newTenant: NewTenant): Promise<TenantSummary> {
    const tenant = await prisma.tenant.create({
      data: { nome: newTenant.nome, slug: newTenant.slug },
    })

    return toDomainTenantSummary(tenant)
  }
}

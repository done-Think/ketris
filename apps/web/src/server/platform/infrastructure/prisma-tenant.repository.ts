import { prisma } from '@server/db/prisma'

import type { TenantRepository } from '../application/ports/tenant-repository.port'
import type { NewTenant } from '../types/tenant-repository'
import type { TenantSummary } from '../types/tenant-summary'

function toDomainTenantSummary(tenant: {
  id: string
  name: string
  slug: string
  createdAt: Date
}): TenantSummary {
  return {
    id: tenant.id,
    name: tenant.name,
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

  async create(newTenant: NewTenant): Promise<TenantSummary> {
    const tenant = await prisma.tenant.create({
      data: {
        name: newTenant.name,
        slug: newTenant.slug,
        accountType: newTenant.accountType,
        status: newTenant.status,
      },
    })

    return toDomainTenantSummary(tenant)
  }

  async searchByName(query: string, excludeSlugs: string[]): Promise<TenantSummary[]> {
    const tenants = await prisma.tenant.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
        slug: { notIn: excludeSlugs },
      },
      orderBy: { name: 'asc' },
      take: 20,
    })

    return tenants.map(toDomainTenantSummary)
  }
}

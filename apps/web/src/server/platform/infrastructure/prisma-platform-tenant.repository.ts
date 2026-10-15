import type { Tenant } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type { PlatformTenantRepository } from '../application/ports/platform-tenant-repository.port'
import type { PlatformTenant } from '../domain/platform-tenant.entity'
import type { TenantAccount } from '../domain/tenant-account'

function toDomainPlatformTenant(tenant: Tenant): PlatformTenant {
  return {
    id: tenant.id,
    nome: tenant.nome,
    slug: tenant.slug,
    accountType: tenant.accountType,
    status: tenant.status,
    canceledAt: tenant.canceledAt,
    createdAt: tenant.createdAt,
  }
}

export class PrismaPlatformTenantRepository implements PlatformTenantRepository {
  async findMany(): Promise<PlatformTenant[]> {
    const tenants = await prisma.tenant.findMany({ orderBy: { createdAt: 'asc' } })

    return tenants.map(toDomainPlatformTenant)
  }

  async findById(tenantId: string): Promise<PlatformTenant | null> {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })

    return tenant ? toDomainPlatformTenant(tenant) : null
  }

  async updateAccount(tenantId: string, account: TenantAccount): Promise<PlatformTenant> {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        accountType: account.accountType,
        status: account.status,
        canceledAt: account.canceledAt,
      },
    })

    return toDomainPlatformTenant(tenant)
  }
}

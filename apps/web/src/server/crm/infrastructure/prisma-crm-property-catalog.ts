import type { Prisma } from '@prisma/client'
import type { CrmPropertyCatalog } from '../application/ports/crm-property-catalog.port'
import type { CrmDatabase, CrmScope } from '../types/prisma'
import type { CrmPropertyFilters } from '../types/property'
import { crmPropertyInclude, toCrmProperty } from './crm-property.mapper'

export class PrismaCrmPropertyCatalog implements CrmPropertyCatalog {
  constructor(
    private readonly db: CrmDatabase,
    private readonly scope: CrmScope,
  ) {}
  private where(): Prisma.PropertyWhereInput {
    return {
      tenantId: this.scope.actorTenantId,
      ...(this.scope.actorRole === 'AGENT' ? { responsibleId: this.scope.actorId ?? '' } : {}),
    }
  }
  async list(filters: CrmPropertyFilters) {
    const where = this.where()
    if (filters.q)
      where.OR = [
        { title: { contains: filters.q, mode: 'insensitive' } },
        { address: { city: { contains: filters.q, mode: 'insensitive' } } },
        { address: { neighborhood: { contains: filters.q, mode: 'insensitive' } } },
      ]
    const totalCount = await this.db.property.count({ where })
    const pageCount = Math.max(1, Math.ceil(totalCount / filters.pageSize))
    const page = Math.min(filters.page, pageCount)
    const rows = await this.db.property.findMany({
      where,
      include: crmPropertyInclude,
      orderBy: [{ title: 'asc' }, { id: 'asc' }],
      skip: (page - 1) * filters.pageSize,
      take: filters.pageSize,
    })
    return {
      properties: rows.map(toCrmProperty),
      pagination: { page, pageSize: filters.pageSize, totalCount, pageCount },
    }
  }
  async get(id: string) {
    const row = await this.db.property.findFirst({
      where: { ...this.where(), id },
      include: crmPropertyInclude,
    })
    return row ? toCrmProperty(row) : null
  }
}

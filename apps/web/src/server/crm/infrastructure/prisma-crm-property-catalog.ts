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
  private where(): Prisma.ImovelWhereInput {
    return {
      tenantId: this.scope.actorTenantId,
      ...(this.scope.actorPapel === 'AGENT' ? { responsavelId: this.scope.actorId ?? '' } : {}),
    }
  }
  async list(filters: CrmPropertyFilters) {
    const where = this.where()
    if (filters.q)
      where.OR = [
        { titulo: { contains: filters.q, mode: 'insensitive' } },
        { endereco: { cidade: { contains: filters.q, mode: 'insensitive' } } },
        { endereco: { bairro: { contains: filters.q, mode: 'insensitive' } } },
      ]
    const totalCount = await this.db.imovel.count({ where })
    const pageCount = Math.max(1, Math.ceil(totalCount / filters.pageSize))
    const page = Math.min(filters.page, pageCount)
    const rows = await this.db.imovel.findMany({
      where,
      include: crmPropertyInclude,
      orderBy: [{ titulo: 'asc' }, { id: 'asc' }],
      skip: (page - 1) * filters.pageSize,
      take: filters.pageSize,
    })
    return {
      properties: rows.map(toCrmProperty),
      pagination: { page, pageSize: filters.pageSize, totalCount, pageCount },
    }
  }
  async get(id: string) {
    const row = await this.db.imovel.findFirst({
      where: { ...this.where(), id },
      include: crmPropertyInclude,
    })
    return row ? toCrmProperty(row) : null
  }
}

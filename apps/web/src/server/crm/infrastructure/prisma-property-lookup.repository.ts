import type { CrmDatabase } from '../types/prisma'

import type { PropertyLookupPort } from '../application/ports/property-lookup.port'

export class PrismaPropertyLookupRepository implements PropertyLookupPort {
  constructor(private readonly db: CrmDatabase) {}
  async existsForTenant(tenantId: string, propertyId: string): Promise<boolean> {
    const count = await this.db.imovel.count({ where: { tenantId, id: propertyId } })

    return count > 0
  }

  async findResponsavelId(tenantId: string, propertyId: string): Promise<string | null> {
    const imovel = await this.db.imovel.findFirst({
      where: { tenantId, id: propertyId },
      select: { responsavelId: true },
    })

    return imovel?.responsavelId ?? null
  }
}

import type { CrmDatabase } from '../types/prisma'

import type { PropertyLookupPort } from '../application/ports/property-lookup.port'
import type { LeadPropertyLookupPort } from '../application/ports/lead-property-lookup.port'

export class PrismaPropertyLookupRepository implements PropertyLookupPort, LeadPropertyLookupPort {
  constructor(private readonly db: CrmDatabase) {}
  findAvailable(tenantId: string, propertyId: string, responsibleId?: string) {
    return this.db.property.findFirst({
      where: {
        tenantId,
        id: propertyId,
        status: 'PUBLISHED',
        ...(responsibleId !== undefined ? { responsibleId } : {}),
      },
      select: { id: true, title: true, responsibleId: true },
    })
  }
  async existsForTenant(tenantId: string, propertyId: string): Promise<boolean> {
    const count = await this.db.property.count({ where: { tenantId, id: propertyId } })

    return count > 0
  }

  async findResponsibleId(tenantId: string, propertyId: string): Promise<string | null> {
    const property = await this.db.property.findFirst({
      where: { tenantId, id: propertyId },
      select: { responsibleId: true },
    })

    return property?.responsibleId ?? null
  }
}

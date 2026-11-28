import type { CrmDatabase } from '../types/prisma'

import type { PropertyLookupPort } from '../application/ports/property-lookup.port'
import type { LeadPropertyLookupPort } from '../application/ports/lead-property-lookup.port'
import { crmPropertyAccessWhere } from './crm-property-access'

export class PrismaPropertyLookupRepository implements PropertyLookupPort, LeadPropertyLookupPort {
  constructor(private readonly db: CrmDatabase) {}
  findAvailable(tenantId: string, propertyId: string, responsibleId?: string) {
    return this.db.property.findFirst({
      where: {
        ...crmPropertyAccessWhere(tenantId, responsibleId),
        id: propertyId,
        status: 'PUBLISHED',
      },
      select: { id: true, title: true, responsibleId: true },
    })
  }
  async existsForTenant(tenantId: string, propertyId: string): Promise<boolean> {
    const count = await this.db.property.count({ where: { tenantId, id: propertyId } })

    return count > 0
  }

  async canAccess(tenantId: string, propertyId: string, brokerId: string): Promise<boolean> {
    const property = await this.db.property.findFirst({
      where: { ...crmPropertyAccessWhere(tenantId, brokerId), id: propertyId },
      select: { id: true },
    })

    return property !== null
  }
}

import { prisma } from '@server/db/prisma'

import type { PropertyLookupPort } from '../application/ports/property-lookup.port'

export class PrismaPropertyLookupRepository implements PropertyLookupPort {
  async existsForTenant(tenantId: string, propertyId: string): Promise<boolean> {
    const count = await prisma.imovel.count({ where: { tenantId, id: propertyId } })

    return count > 0
  }
}

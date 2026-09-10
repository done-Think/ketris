import { prisma } from '@server/db/prisma'

import type { PropertyLookupPort } from '../application/ports/property-lookup.port'

export class PrismaPropertyLookupRepository implements PropertyLookupPort {
  async existsForTenant(tenantId: string, propertyId: string): Promise<boolean> {
    const count = await prisma.imovel.count({ where: { tenantId, id: propertyId } })

    return count > 0
  }

  async findResponsavelId(tenantId: string, propertyId: string): Promise<string | null> {
    const imovel = await prisma.imovel.findFirst({
      where: { tenantId, id: propertyId },
      select: { responsavelId: true },
    })

    return imovel?.responsavelId ?? null
  }
}

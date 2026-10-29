import { prisma } from '@server/db/prisma'
import type { AgendaPropertyLookup } from '../application/ports/agenda-property-lookup.port'

export class PrismaAgendaPropertyLookup implements AgendaPropertyLookup {
  findAccessibleProperty(tenantId: string, propertyId: string, ownerUserId?: string) {
    return prisma.property.findFirst({
      where: { id: propertyId, tenantId, ...(ownerUserId ? { ownerId: ownerUserId } : {}) },
      select: { id: true, tenantId: true },
    })
  }

  async findRentedProperty(userId: string, propertyId: string) {
    const contract = await prisma.contract.findFirst({
      where: {
        propertyId,
        status: 'ACTIVE',
        parties: { some: { role: 'RENTER', userId, user: { active: true, role: 'RENTER' } } },
      },
      select: { propertyId: true, tenantId: true },
    })
    return contract
  }
}

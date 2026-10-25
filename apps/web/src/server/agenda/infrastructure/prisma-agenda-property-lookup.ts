import { PrismaPropertyRepository } from '@server/properties/infrastructure/prisma-property.repository'
import type { AgendaPropertyLookup } from '../application/ports/agenda-property-lookup.port'

export class PrismaAgendaPropertyLookup implements AgendaPropertyLookup {
  constructor(private readonly properties = new PrismaPropertyRepository()) {}

  findAccessibleProperty(tenantId: string, propertyId: string, ownerUserId?: string) {
    return this.properties.findByTenantAndId(tenantId, propertyId, undefined, ownerUserId)
  }

  findRentedProperty(userId: string, propertyId: string) {
    return this.properties.findRenterContractProperty(userId, propertyId)
  }
}

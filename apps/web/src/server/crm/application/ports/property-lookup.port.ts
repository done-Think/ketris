export interface PropertyLookupPort {
  existsForTenant(tenantId: string, propertyId: string): Promise<boolean>
  canAccess(tenantId: string, propertyId: string, brokerId: string): Promise<boolean>
}

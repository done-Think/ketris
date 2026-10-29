export interface PropertyLookupPort {
  existsForTenant(tenantId: string, propertyId: string): Promise<boolean>
  findResponsibleId(tenantId: string, propertyId: string): Promise<string | null>
}

export interface PropertyLookupPort {
  existsForTenant(tenantId: string, propertyId: string): Promise<boolean>
  findResponsavelId(tenantId: string, propertyId: string): Promise<string | null>
}

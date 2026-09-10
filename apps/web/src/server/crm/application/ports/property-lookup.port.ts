/**
 * Minimal port (ISP) for the one fact `crm` needs to know about a property: whether it exists and
 * belongs to the actor's tenant. Doesn't reuse the whole `PropertyRepository` from the `properties`
 * module — `crm` doesn't need the rest of the entity (address, media, etc.), just existsForTenant.
 */
export interface PropertyLookupPort {
  existsForTenant(tenantId: string, propertyId: string): Promise<boolean>
  /** Resolves the property's responsible broker (`Imovel.responsavelId`), used to scope AGENT access. */
  findResponsavelId(tenantId: string, propertyId: string): Promise<string | null>
}

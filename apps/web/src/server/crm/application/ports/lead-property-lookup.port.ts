export interface LeadProperty {
  id: string
  title: string
  responsibleId: string
}

export interface LeadPropertyLookupPort {
  findAvailable(
    tenantId: string,
    propertyId: string,
    responsibleId?: string,
  ): Promise<LeadProperty | null>
}

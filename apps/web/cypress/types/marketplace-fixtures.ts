export interface MarketplaceFixtureInput {
  suffix: string
  password: string
}
export interface MarketplaceFixtureResult {
  tenantId: string
  ownerEmail: string
  propertyId: string
  propertyTitle: string
}
export interface MarketplaceInquiryEvidence {
  id: string
  tenantId: string
  leadName: string
  leadEmail: string
  proposedValue: number
  status: string
}

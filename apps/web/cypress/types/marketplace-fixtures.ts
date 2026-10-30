export interface MarketplaceFixtureInput {
  suffix: string
  password: string
}

export interface MarketplaceFixtureResult {
  tenantIds: string[]
  propertyId: string
  propertyTitle: string
  rentalPropertyId: string
  rentalPropertyTitle: string
  dualPropertyId: string
  dualPropertyTitle: string
  city: string
  brokerName: string
  ownerEmail: string
}

export interface MarketplaceInquiryEvidence {
  count: number
  status: string | null
  leadName: string | null
  leadEmail: string | null
  proposedValue: number | null
  notes: string | null
}

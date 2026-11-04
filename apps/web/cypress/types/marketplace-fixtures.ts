export interface MarketplaceFixtureInput {
  coordinates?: { latitude: number; longitude: number }
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
  brokerEmail: string
  ownerEmail: string
}

export interface MarketplaceInquiryEvidence {
  leadCount: number
  linked: boolean
  count: number
  status: string | null
  leadName: string | null
  leadEmail: string | null
  proposedValue: number | null
  notes: string | null
}

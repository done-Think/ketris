export interface MarketplaceStats {
  publishedProperties: number
  publishedBrokers: number
  servedCities: number
  locations?: string[]
}

export interface MarketplaceLocationRow {
  location: string
}

export interface PublicAgencyListingSummary {
  id: string
  title: string
  purpose: 'ALUGUEL' | 'VENDA'
  price: number
  neighborhood: string | null
  city: string | null
  coverUrl: string | null
}

export interface PublicAgencyTeamHighlight {
  usuarioId: string
  name: string
  avatarUrl: string | null
  order: number
}

export interface PublicAgencyProfile {
  id: string
  displayName: string
  headline: string | null
  summary: string | null
  legalCreci: string | null
  headquarters: string | null
  address: string | null
  phone: string | null
  email: string | null
  coverage: string[]
  segments: string[]
  yearsInMarket: number | null
  primaryColor: string | null
  secondaryColor: string | null
  backgroundColor: string | null
  logoUrl: string | null
  bannerUrl: string | null
  status: 'DRAFT' | 'PUBLISHED'
  publishedAt: string | null
  stats: { activeListings: number; brokersCount: number; dealsClosed: number }
  team: PublicAgencyTeamHighlight[]
  featuredListings: PublicAgencyListingSummary[]
}

export interface ListAgencyProfilesResponse {
  agencies: PublicAgencyProfile[]
}

export interface AgencyProfileResponse {
  agency: PublicAgencyProfile
}

export interface OwnAgencyProfileResponse {
  profile: PublicAgencyProfile | null
}

export interface SaveAgencyProfileRequest {
  displayName: string
  headline: string | null
  summary: string | null
  legalCreci: string | null
  headquarters: string | null
  address: string | null
  phone: string | null
  email: string | null
  coverage: string[]
  segments: string[]
  yearsInMarket: number | null
  backgroundColor: string | null
  logoUrl: string | null
  bannerUrl: string | null
  team: Array<{ usuarioId: string; order: number }>
}

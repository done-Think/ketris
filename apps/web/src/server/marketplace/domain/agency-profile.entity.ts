export type AgencyProfileStatus = 'DRAFT' | 'PUBLISHED'

export interface AgencyListingSummary {
  id: string
  title: string
  purpose: 'ALUGUEL' | 'VENDA'
  price: number
  neighborhood: string | null
  city: string | null
  coverUrl: string | null
}

export interface AgencyTeamHighlight {
  usuarioId: string
  name: string
  avatarUrl: string | null
  order: number
}

export interface AgencyProfileStats {
  activeListings: number
  brokersCount: number
  dealsClosed: number
}

export interface AgencyProfile {
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
  status: AgencyProfileStatus
  publishedAt: Date | null
  stats: AgencyProfileStats
  team: AgencyTeamHighlight[]
  featuredListings: AgencyListingSummary[]
}

export interface AgencyProfileTeamMemberInput {
  usuarioId: string
  order: number
}

export interface AgencyProfileDraft {
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
  team: AgencyProfileTeamMemberInput[]
}

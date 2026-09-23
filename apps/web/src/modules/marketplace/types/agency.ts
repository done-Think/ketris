import type { ViewMode } from './search'

export type AgencyProfileStatus = 'DRAFT' | 'PUBLISHED'

export type AgencyTeamHighlight = {
  usuarioId: string
  name: string
  avatarUrl: string | null
}

export type AgencyProfile = {
  id: string
  name: string
  legalCreci: string | null
  logoInitials: string
  brand: {
    primaryColor: string | null
    secondaryColor: string | null
    backgroundColor: string | null
  }
  headquarters: string | null
  address: string | null
  coverage: string[]
  segments: string[]
  activeListings: number
  brokersCount: number
  dealsClosed: number
  responseTime: string | null
  yearsInMarket: number | null
  rating: number | null
  phone: string | null
  email: string | null
  summary: string | null
  href: string
  teamHighlights: AgencyTeamHighlight[]
  featuredListings: Array<{
    title: string
    location: string
    price: string
    href: string
    image?: string
  }>
}

export type AgencyCardProps = AgencyProfile & {
  viewMode?: ViewMode
}

export type AgencyPublicProfilePageProps = {
  agency: AgencyProfile
}

export type AgencyProfileHeroProps = {
  agency: AgencyProfile
}

export type AgencyBrandBannerProps = {
  agency: AgencyProfile
  size: 'compact' | 'hero'
}

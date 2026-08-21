export type AgencySegment = 'Residencial' | 'Comercial' | 'Alto padrão' | 'Administração'

export type AgencyProfile = {
  id: string
  name: string
  legalCreci: string
  logoInitials: string
  brand: {
    eyebrow: string
    title: string
    primaryColor: string
    secondaryColor: string
    backgroundColor: string
  }
  headquarters: string
  coverage: string[]
  segments: AgencySegment[]
  activeListings: number
  brokersCount: number
  responseTime: string
  yearsInMarket: number
  dealsClosed: number
  rating: number
  phone: string
  email: string
  address: string
  summary: string
  href: string
  teamHighlights: string[]
  featuredListings: Array<{
    title: string
    location: string
    price: string
    href: string
  }>
}

export type AgencyCardProps = AgencyProfile

export type AgencyPublicProfilePageProps = {
  agency: AgencyProfile
}

export type AgencyBrandBannerProps = {
  agency: AgencyProfile
  size: 'compact' | 'hero'
}

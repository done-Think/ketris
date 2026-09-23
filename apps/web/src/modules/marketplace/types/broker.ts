import type { ViewMode } from './search'

export type BrokerProfileStatus = 'DRAFT' | 'PUBLISHED'

export type BrokerProfile = {
  id: string
  agencyName: string
  email: string
  name: string
  creci: string | null
  avatar: string | null
  region: string | null
  specialties: string[]
  neighborhoods: string[]
  activeListings: number
  dealsClosed: number
  responseTime: string | null
  rating: number | null
  phone: string | null
  availability: string | null
  bio: string | null
  href: string
  highlightedListings: Array<{
    title: string
    location: string
    price: string
    href: string
    image?: string
  }>
}

export type BrokerCardProps = BrokerProfile & {
  href: string
  viewMode?: ViewMode
}

export type BrokerPublicProfilePageProps = {
  broker: BrokerProfile
}

export type BrokerProfileTheme = {
  label: string
  tone: string
  accent: string
  cover: string
  signature: string
  summary: string
  method: string[]
}

export type BrokerProfileHeroProps = {
  broker: BrokerProfile
  theme: BrokerProfileTheme
}

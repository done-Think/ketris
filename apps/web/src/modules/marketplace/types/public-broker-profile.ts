export interface PublicBrokerListingSummary {
  id: string
  title: string
  purpose: 'ALUGUEL' | 'VENDA'
  price: number
  neighborhood: string | null
  city: string | null
  coverUrl: string | null
}

export interface PublicBrokerProfile {
  id: string
  agencyName: string
  email: string
  displayName: string
  headline: string | null
  bio: string | null
  creci: string | null
  phone: string | null
  region: string | null
  neighborhoods: string[]
  specialties: string[]
  availability: string | null
  primaryColor: string | null
  secondaryColor: string | null
  backgroundColor: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  status: 'DRAFT' | 'PUBLISHED'
  publishedAt: string | null
  stats: { activeListings: number; dealsClosed: number }
  recentListings: PublicBrokerListingSummary[]
}

export interface ListBrokerProfilesResponse {
  brokers: PublicBrokerProfile[]
}

export interface BrokerProfileResponse {
  broker: PublicBrokerProfile
}

export interface OwnBrokerProfileResponse {
  profile: PublicBrokerProfile | null
}

export interface SaveBrokerProfileRequest {
  displayName: string
  headline: string | null
  bio: string | null
  creci: string | null
  phone: string | null
  region: string | null
  neighborhoods: string[]
  specialties: string[]
  availability: string | null
  primaryColor: string | null
  secondaryColor: string | null
  backgroundColor: string | null
  avatarUrl: string | null
  bannerUrl: string | null
}

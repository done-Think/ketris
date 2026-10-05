export type BrokerProfileStatus = 'DRAFT' | 'PUBLISHED'

export interface BrokerListingSummary {
  id: string
  title: string
  purpose: 'ALUGUEL' | 'VENDA' | 'AMBOS'
  price: number
  neighborhood: string | null
  city: string | null
  coverUrl: string | null
}

export interface BrokerProfileStats {
  activeListings: number
  dealsClosed: number
}

export interface BrokerProfile {
  id: string
  tenantId: string
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
  status: BrokerProfileStatus
  publishedAt: Date | null
  stats: BrokerProfileStats
  recentListings: BrokerListingSummary[]
}

export type PublicBrokerProfile = Omit<BrokerProfile, 'tenantId'>

export interface BrokerProfileDraft {
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

export type BrokerProfileStatus = 'DRAFT' | 'PUBLISHED'

export interface BrokerListingSummary {
  id: string
  title: string
  purpose: 'ALUGUEL' | 'VENDA'
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

export function toPublicBrokerProfile(profile: BrokerProfile): PublicBrokerProfile {
  return {
    id: profile.id,
    agencyName: profile.agencyName,
    email: profile.email,
    displayName: profile.displayName,
    headline: profile.headline,
    bio: profile.bio,
    creci: profile.creci,
    phone: profile.phone,
    region: profile.region,
    neighborhoods: profile.neighborhoods,
    specialties: profile.specialties,
    availability: profile.availability,
    primaryColor: profile.primaryColor,
    secondaryColor: profile.secondaryColor,
    backgroundColor: profile.backgroundColor,
    avatarUrl: profile.avatarUrl,
    bannerUrl: profile.bannerUrl,
    status: profile.status,
    publishedAt: profile.publishedAt,
    stats: profile.stats,
    recentListings: profile.recentListings,
  }
}

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

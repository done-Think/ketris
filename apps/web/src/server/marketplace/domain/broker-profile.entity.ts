import type { BrokerProfile, PublicBrokerProfile } from '../types/broker-profile'

export function toPublicBrokerProfile(profile: BrokerProfile): PublicBrokerProfile {
  return {
    id: profile.id,
    agencyName: profile.agencyName,
    email: profile.email,
    displayName: profile.displayName,
    headline: profile.headline,
    summary: profile.summary,
    creci: profile.creci,
    phone: profile.phone,
    region: profile.region,
    coverage: profile.coverage,
    segments: profile.segments,
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

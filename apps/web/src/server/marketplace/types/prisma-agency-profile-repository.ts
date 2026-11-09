export type TenantWithProfileRow = {
  id: string
  name: string
  primaryColor: string | null
  secondaryColor: string | null
  publicProfile: {
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
    publishedAt: Date | null
    highlights: { position: number; user: { id: string; name: string; avatarUrl: string | null } }[]
  } | null
}

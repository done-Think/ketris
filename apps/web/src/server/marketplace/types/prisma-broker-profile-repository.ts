export type UserWithProfileRow = {
  id: string
  tenantId: string
  name: string
  email: string
  avatarUrl: string | null
  tenant: { name: string }
  publicProfile: {
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
    publishedAt: Date | null
  } | null
}

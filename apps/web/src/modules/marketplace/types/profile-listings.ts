import type { PropertyCardData } from '@shared/types'

export type ProfileListingSource = {
  title: string
  location: string
  price: string
  href: string
}

export type ProfileListingOptions = {
  brokerName?: string
  coverage?: string[]
  limit?: number
}

export type PublicProfileListing = ProfileListingSource & {
  image?: string
  details: PropertyCardData['details']
  category?: string
}

export type PublicProfileSource = {
  href: string
  name: string
  type: 'agency' | 'broker'
}

export type PublicProfileListingsProps = {
  accentColor: string
  listings: PublicProfileListing[]
  source?: PublicProfileSource
}

export type ProfileListingPreviewSectionProps = {
  accentColor: string
  backgroundColor: string
  hoverBorderColor: string
  listings: PublicProfileListing[]
  sideBorderBreakpoint?: 'lg' | 'md'
}

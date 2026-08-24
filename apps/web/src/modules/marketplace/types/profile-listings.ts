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

export type PublicProfileListingSource = {
  href: string
  name: string
  type: 'agency' | 'broker'
}

export type PublicProfileListingsProps = {
  accentColor: string
  listings: PublicProfileListing[]
  source?: PublicProfileListingSource
}

export type PublicProfileSidebarProps = {
  accentColor: string
  hoverColor: string
  href: string
  linkDescription: string
  phone: string
  email: string
  facts: Array<{
    label: string
    value: string
  }>
}

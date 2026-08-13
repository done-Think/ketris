import type { SvgIconComponent } from '@mui/icons-material'

import type { AgencyProfile } from './agency'
import type { BrokerProfile } from './broker'
import type { BrokerProfileTheme } from './broker-profile-theme'
import type { MarketplacePropertyDetail } from './property-detail'

export type ProfileListingSource = {
  title: string
  location: string
  price: string
  href: string
}

export type PublicProfileListing = ProfileListingSource & {
  image?: MarketplacePropertyDetail['image']
  details: MarketplacePropertyDetail['details']
  category?: MarketplacePropertyDetail['category']
}

export type AgencyProfileHeroProps = {
  agency: AgencyProfile
}

export type BrokerProfileHeroProps = {
  broker: BrokerProfile
  theme: BrokerProfileTheme
}

export type PublicProfileFact = {
  label: string
  value: string
}

export type PublicProfileSidebarProps = {
  accentColor: string
  hoverColor: string
  href: string
  linkDescription: string
  phone: string
  email: string
  facts: PublicProfileFact[]
}

export type PublicProfileMetric = {
  label: string
  value: string | number
  icon?: SvgIconComponent
}

export type PublicProfileMetricsProps = {
  accentColor: string
  metrics: PublicProfileMetric[]
}

export type PublicProfileListingsProps = {
  accentColor: string
  listings: PublicProfileListing[]
}

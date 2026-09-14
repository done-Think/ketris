import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined'
import StarRoundedIcon from '@mui/icons-material/StarRounded'

import { alpha, radius, shadows, surface } from '@shared/theme/tokens'

import { agencyPublicProfileSectionOptions } from '../../data/agency-public-profile-editor'
import type {
  AgencyPublicProfileSectionKey,
  AgencyPublicProfileSectionSlotKey,
} from '../../types/agency-public-profile-editor'

export const agencySectionIcons: Record<
  AgencyPublicProfileSectionKey,
  typeof ApartmentOutlinedIcon
> = {
  brand: ApartmentOutlinedIcon,
  metrics: StarRoundedIcon,
  contact: LinkOutlinedIcon,
  team: GroupsOutlinedIcon,
  listings: HomeWorkOutlinedIcon,
}

export const agencyEditorPanelSx = {
  bgcolor: surface.paper,
  border: '1px solid',
  borderColor: alpha.graphite[8],
  borderRadius: `${radius.sm}px`,
  boxShadow: shadows.propertyCard,
  p: { xs: 2, md: 2.6 },
} as const

export function isAgencyPublicProfileSectionKey(
  sectionKey: AgencyPublicProfileSectionSlotKey,
): sectionKey is AgencyPublicProfileSectionKey {
  return sectionKey !== 'none'
}

export function getAgencySectionOption(sectionKey: AgencyPublicProfileSectionSlotKey) {
  return agencyPublicProfileSectionOptions.find((section) => section.key === sectionKey)
}

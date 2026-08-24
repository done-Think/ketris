import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded'

import { alpha, radius, shadows, surface } from '@shared/theme/tokens'

import { publicProfileSectionOptions } from '../../data/public-profile-editor'
import type {
  PublicProfileSectionKey,
  PublicProfileSectionSlotKey,
} from '../../types/public-profile-editor'

export const sectionIcons: Record<PublicProfileSectionKey, typeof QueryStatsRoundedIcon> = {
  hero: CheckCircleOutlineRoundedIcon,
  metrics: QueryStatsRoundedIcon,
  team: PeopleAltOutlinedIcon,
  listings: HomeWorkOutlinedIcon,
  contact: LinkOutlinedIcon,
}

export const editorPanelSx = {
  bgcolor: surface.paper,
  border: '1px solid',
  borderColor: alpha.graphite[8],
  borderRadius: `${radius.sm}px`,
  boxShadow: shadows.propertyCard,
  p: { xs: 2, md: 2.6 },
} as const

export function isPublicProfileSectionKey(
  sectionKey: PublicProfileSectionSlotKey,
): sectionKey is PublicProfileSectionKey {
  return sectionKey !== 'none'
}

export function getSectionOption(sectionKey: PublicProfileSectionSlotKey) {
  return publicProfileSectionOptions.find((section) => section.key === sectionKey)
}

import type { SxProps, Theme } from '@mui/material'
import { labelSx, panelSx } from './opportunity-detail.styles'

export const paperSx: SxProps<Theme> = {
  ...panelSx,
  height: '100%',
  pl: { xs: 3.65, md: 4.45 },
  pr: { xs: 2.4, md: 3.2 },
  py: { xs: 2, md: 2.5 },
}

export const typographySx: SxProps<Theme> = {
  mb: 1.35,
  fontSize: 16,
  fontWeight: 800,
  textAlign: 'center',
}

export const dividerSx: SxProps<Theme> = { my: 1.25 }

export const typographySx2: SxProps<Theme> = { ...labelSx, textAlign: 'center' }

export const stackSx: SxProps<Theme> = { mt: 0.8 }

export function getBoxSx(opportunity: import('../types/opportunity').Opportunity): SxProps<Theme> {
  return { mb: opportunity.notes ? 2 : 0 }
}

export const detailGridSx = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
  columnGap: 1.4,
  rowGap: 1,
  '& > :nth-of-type(even)': {
    pl: { sm: 3.65, md: 4.45 },
  },
} as const
export const sectionTitleSx = {
  mb: 0.45,
  color: 'text.secondary',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 0,
  textAlign: 'center',
  textTransform: 'uppercase',
} as const

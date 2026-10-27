import type { SxProps, Theme } from '@mui/material'
import { panelSx } from './opportunity-detail.styles'

export const paperSx: SxProps<Theme> = {
  ...panelSx,
  px: { xs: 2.4, md: 3.2 },
  py: { xs: 2, md: 2.5 },
}

export const titleSx: SxProps<Theme> = { mb: 1.35, fontSize: 16, fontWeight: 800 }

export const nameSx: SxProps<Theme> = { fontSize: 14, fontWeight: 700 }

import type { SxProps, Theme } from '@mui/material'
import { labelSx } from './opportunity-detail.styles'

export const typographySx: SxProps<Theme> = { ...labelSx, textAlign: 'center' }

export const typographySx2: SxProps<Theme> = {
  mt: 0.25,
  fontSize: 13,
  fontWeight: 600,
  overflowWrap: 'anywhere',
  textAlign: 'center',
}

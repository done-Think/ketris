import type { SxProps, Theme } from '@mui/material'
import { iconSize, radius, surface } from '@shared/theme/tokens'
import type { CrmStatusColors } from '../types/style'
import { panelSx } from './opportunity-detail.styles'

export const stackSx: SxProps<Theme> = {
  width: '100%',
  px: 1.45,
  py: 1.55,
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: `${radius.sm}px`,
  bgcolor: surface.paper,
  cursor: 'pointer',
  font: 'inherit',
  textAlign: 'left',
  '&:hover': {
    borderColor: 'divider',
  },
  '&:focus': {
    outline: 'none',
  },
  '&:focus-visible': {
    outline: 'none',
  },
}

export const iconSx: SxProps<Theme> = { fontSize: iconSize.sm }

export const typographySx: SxProps<Theme> = {
  minWidth: 0,
  overflow: 'hidden',
  fontSize: 13.5,
  fontWeight: 800,
  lineHeight: 1.35,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

export const boxSx: SxProps<Theme> = {
  position: 'relative',
  minHeight: '100%',
  height: { lg: '100%' },
}

export const paperSx: SxProps<Theme> = {
  ...panelSx,
  position: { xs: 'relative', lg: 'absolute' },
  inset: { lg: 0 },
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  p: { xs: 2, md: 2.5 },
}

export const typographySx2: SxProps<Theme> = {
  mb: 1.35,
  fontSize: 16,
  fontWeight: 800,
  textAlign: 'center',
}

export const boxSx2: SxProps<Theme> = {
  display: 'flex',
  minHeight: 0,
  flex: 1,
  flexDirection: 'column',
  p: 1,
  borderRadius: `${radius.sm}px`,
  bgcolor: surface.app,
  overflowY: 'auto',
  scrollbarWidth: 'thin',
}

export const stackSx2: SxProps<Theme> = {
  flex: 1,
  minHeight: { xs: 246, md: 258 },
  p: 2,
  borderRadius: `${radius.sm}px`,
}

export const calendarMonthOutlinedIconSx: SxProps<Theme> = { color: 'text.disabled' }

export const typographySx3: SxProps<Theme> = { fontSize: 13, fontWeight: 700 }

export function getAvatarSx(tone: CrmStatusColors): SxProps<Theme> {
  return {
    width: 34,
    height: 34,
    flexShrink: 0,
    bgcolor: tone.softColor,
    color: tone.color,
  }
}

export function getTypographySx(expanded: boolean): SxProps<Theme> {
  return {
    mt: 0.55,
    overflow: expanded ? 'visible' : 'hidden',
    fontSize: 11.8,
    lineHeight: 1.5,
    textOverflow: expanded ? 'clip' : 'ellipsis',
    whiteSpace: expanded ? 'normal' : 'nowrap',
  }
}

import type { SxProps, Theme } from '@mui/material'
import { brand, iconSize, radius, surface } from '@shared/theme/tokens'
import { panelSx } from './opportunity-detail.styles'

export const boxSx: SxProps<Theme> = {
  position: 'relative',
  minHeight: 148,
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

export const typographySx: SxProps<Theme> = {
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

export const stackSx: SxProps<Theme> = {
  px: 1.45,
  py: 1.55,
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: `${radius.sm}px`,
  bgcolor: surface.paper,
}

export const avatarSx: SxProps<Theme> = {
  width: 34,
  height: 34,
  flexShrink: 0,
  bgcolor: surface.app,
  color: brand.neutral[500],
}

export const historyRoundedIconSx: SxProps<Theme> = { fontSize: iconSize.sm }

export const boxSx3: SxProps<Theme> = {
  minWidth: 0,
  flex: 1,
}

export const typographySx2: SxProps<Theme> = { fontSize: 13, fontWeight: 800 }

export const chipSx: SxProps<Theme> = { height: 22, flexShrink: 0, fontSize: 11, fontWeight: 700 }

export const typographySx3: SxProps<Theme> = { mt: 0.25, fontSize: 11.5 }

export const stackSx2: SxProps<Theme> = {
  minHeight: 86,
  p: 2,
  borderRadius: `${radius.sm}px`,
}

export const historyRoundedIconSx2: SxProps<Theme> = { color: 'text.disabled' }

export const typographySx4: SxProps<Theme> = { fontSize: 13, fontWeight: 700 }

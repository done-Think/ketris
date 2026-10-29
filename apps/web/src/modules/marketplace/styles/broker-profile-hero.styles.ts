import type { SxProps, Theme } from '@mui/material'
import { defaultProfileCoverImage } from '../config/profile-defaults'
import type { BrokerProfile } from '../types/broker'
import { alpha } from '@shared/theme/tokens'
import { brand } from '@shared/theme/tokens'
import { radius, shadows, surface } from '@shared/theme/tokens'

export const styles = {
  box: {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    boxShadow: shadows.propertyCard,
    overflow: 'hidden',
    mb: 2.5,
  },
  box2: { maxWidth: 720 },
  typography: {
    color: surface.lightText,
    fontSize: { xs: 22, md: 34 },
    fontWeight: 700,
    lineHeight: 1.12,
    letterSpacing: 0,
  },
  avatar: {
    width: { xs: 86, md: 118 },
    height: { xs: 86, md: 118 },
    boxShadow: `0 0 0 5px ${surface.paper}`,
  },
  box3: { minWidth: 0 },
  typography2: {
    color: surface.darkText,
    fontSize: { xs: 28, md: 42 },
    fontWeight: 700,
    lineHeight: 1.08,
    letterSpacing: 0,
    mb: 1,
  },
  typography3: { color: 'text.secondary', fontSize: 14, fontWeight: 500 },
  box4: { p: { xs: 2, md: 3 } },
  typography4: { color: 'text.secondary', maxWidth: 760 },
} satisfies Record<string, SxProps<Theme>>

export function getBoxStyles({ broker }: { broker: BrokerProfile }): SxProps<Theme> {
  return {
    minHeight: { xs: 170, md: 260 },
    backgroundImage: `linear-gradient(90deg, ${brand.graphite[900]}, ${alpha.graphite[18]}), url("${broker.bannerUrl ?? defaultProfileCoverImage}")`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    display: 'grid',
    alignItems: 'end',
    p: { xs: 2, md: 3 },
  }
}

export function getBoxStyles2({ broker }: { broker: BrokerProfile }): SxProps<Theme> {
  return {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: 'auto minmax(0, 1fr)' },
    gap: { xs: 2, md: 2.5 },
    alignItems: 'center',
    bgcolor: broker.backgroundColor ?? surface.app,
    p: { xs: 2, md: 3 },
  }
}

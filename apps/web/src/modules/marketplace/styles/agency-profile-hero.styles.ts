import type { SxProps, Theme } from '@mui/material'
import { defaultProfileCoverImage } from '../config/profile-defaults'
import type { AgencyProfile } from '../types/agency'
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
  typography: {
    color: surface.lightText,
    fontSize: { xs: 18, md: 26 },
    fontWeight: 700,
    lineHeight: 1.15,
    maxWidth: 720,
  },
  box2: { p: { xs: 2, md: 3 } },
  stack: { mb: 1.3 },
  typography2: {
    color: surface.darkText,
    fontSize: { xs: 28, md: 42 },
    fontWeight: 700,
    lineHeight: 1.08,
    letterSpacing: 0,
    mb: 1,
  },
  typography3: { color: 'text.secondary', fontSize: 14, fontWeight: 500, mb: 2 },
  typography4: { color: 'text.secondary', maxWidth: 860 },
} satisfies Record<string, SxProps<Theme>>

export function getBoxStyles({ agency }: { agency: AgencyProfile }): SxProps<Theme> {
  return {
    minHeight: { xs: 130, md: 180 },
    backgroundImage: `linear-gradient(90deg, ${brand.graphite[900]}, ${alpha.graphite[18]}), url("${agency.bannerUrl ?? defaultProfileCoverImage}")`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    display: 'grid',
    alignItems: 'end',
    p: { xs: 2, md: 3 },
  }
}

export function getBoxStyles2({ agency }: { agency: AgencyProfile }): SxProps<Theme> {
  return { bgcolor: agency.brand.backgroundColor, p: { xs: 2, md: 3 } }
}

export function getChipStyles({ agency }: { agency: AgencyProfile }): SxProps<Theme> {
  return {
    borderRadius: `${radius.sm}px`,
    bgcolor: alpha.graphite[6],
    color: agency.brand.primaryColor,
    fontWeight: 700,
  }
}

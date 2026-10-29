import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

export const styles = {
  card: {
    position: { lg: 'sticky' },
    top: { lg: 24 },
    bgcolor: surface.paper,
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.sm}px`,
    boxShadow: shadows.propertyCard,
  },
  box: { p: 2.2 },
  typography: {
    color: brand.neutral[500],
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 0.25,
    textTransform: 'uppercase',
  },
  stack: { mt: 1.6 },
  avatar: {
    width: 48,
    height: 48,
    bgcolor: alpha.magenta[10],
    color: brand.magenta[500],
    fontSize: 17,
    fontWeight: 800,
  },
  box2: { minWidth: 0 },
  typography2: { color: brand.neutral[500], fontSize: 12.5, fontFamily: 'monospace' },
  divider: { borderColor: alpha.graphite[6] },
  typography3: { color: brand.neutral[500], fontSize: 12, textAlign: 'right' },
  typography4: { color: brand.graphite[500], fontSize: 14, fontWeight: 900, mb: 1.2 },
  stack2: { m: 0, p: 0, listStyle: 'none' },
  typography5: { color: brand.neutral[500], fontSize: 13 },
  box3: { color: brand.graphite[500], fontSize: 13.5, fontWeight: 800, textAlign: 'right' },
} satisfies Record<string, SxProps<Theme>>

export function getTypographyStyles({ displayName }: { displayName: string }): SxProps<Theme> {
  return {
    color: displayName ? brand.graphite[500] : brand.neutral[400],
    fontSize: 16,
    fontWeight: 900,
  }
}

export function getBoxStyles({ index }: { index: number }): SxProps<Theme> {
  return {
    display: 'grid',
    placeItems: 'center',
    width: 22,
    height: 22,
    flexShrink: 0,
    borderRadius: radius.full,
    bgcolor: index === 0 ? brand.magenta[500] : brand.neutral[100],
    color: index === 0 ? surface.paper : brand.neutral[500],
    fontSize: 11.5,
    fontWeight: 800,
  }
}

export function getTypographyStyles2({ index }: { index: number }): SxProps<Theme> {
  return {
    color: index === 0 ? brand.graphite[500] : brand.neutral[500],
    fontSize: 13,
    fontWeight: index === 0 ? 700 : 500,
  }
}

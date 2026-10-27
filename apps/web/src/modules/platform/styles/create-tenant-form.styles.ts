import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

const sectionPx = { xs: 2, md: 2.8 }

const cardSx = {
  bgcolor: surface.paper,
  borderColor: alpha.graphite[6],
  borderRadius: `${radius.sm}px`,
  boxShadow: shadows.propertyCard,
  overflow: 'hidden',
}

const visuallyHiddenSx = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  border: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  opacity: 0,
} as const

export const styles = {
  box: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 360px' },
    gap: 2.4,
    alignItems: 'start',
    maxWidth: 1180,
  },
  box2: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
    gap: 1.2,
  },
  divider: { borderColor: alpha.graphite[6] },
  typography: { color: brand.graphite[500], fontSize: 14, fontWeight: 700 },
  typography2: { color: brand.neutral[500], fontSize: 12.5 },
  formControlLabel: { alignItems: 'flex-start', m: 0, gap: 1, '& .MuiSwitch-root': { mt: -0.5 } },
  stack: { mb: 2 },
  box3: {
    display: 'grid',
    placeItems: 'center',
    width: 24,
    height: 24,
    flexShrink: 0,
    borderRadius: radius.full,
    bgcolor: alpha.magenta[10],
    color: brand.magenta[500],
    fontSize: 12,
    fontWeight: 800,
  },
  typography3: { color: brand.graphite[500], fontSize: 16, fontWeight: 900 },
  typography4: { color: brand.neutral[500], fontSize: 13 },
  checkCircleRoundedIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    color: brand.magenta[500],
    fontSize: 20,
  },
  icon: { fontSize: iconSize.lg },
  typography5: { color: brand.graphite[500], fontSize: 14.5, fontWeight: 800 },
  typography6: { color: brand.graphite[500], fontSize: 13, fontWeight: 700, mt: 0.4 },
  typography7: { color: brand.neutral[500], fontSize: 12 },
  card: cardSx,
  visuallyHidden: visuallyHiddenSx,
  formBody: { px: sectionPx, pb: 2 },
  formActions: {
    px: sectionPx,
    py: 2,
    borderTop: '1px solid',
    borderColor: alpha.graphite[6],
    bgcolor: surface.app,
  },
  section: { px: sectionPx, py: { xs: 2.2, md: 2.6 } },
} satisfies Record<string, SxProps<Theme>>

export function getBoxStyles3({ selected }: { selected: boolean }): SxProps<Theme> {
  return {
    position: 'relative',
    display: 'block',
    cursor: 'pointer',
    p: 1.6,
    borderRadius: `${radius.sm}px`,
    border: '1.5px solid',
    borderColor: selected ? brand.magenta[500] : alpha.graphite[10],
    bgcolor: selected ? alpha.magenta[6] : surface.paper,
    transition: 'border-color 140ms ease, background-color 140ms ease',
    '&:hover': { borderColor: selected ? brand.magenta[500] : alpha.magenta[36] },
    '&:has(input:focus-visible)': {
      outline: `2px solid ${brand.magenta[500]}`,
      outlineOffset: 2,
    },
  }
}

export function getBoxStyles4({ selected }: { selected: boolean }): SxProps<Theme> {
  return {
    display: 'grid',
    placeItems: 'center',
    width: 36,
    height: 36,
    mb: 1.2,
    borderRadius: `${radius.sm}px`,
    bgcolor: selected ? alpha.magenta[10] : brand.neutral[100],
    color: selected ? brand.magenta[500] : brand.graphite[500],
  }
}

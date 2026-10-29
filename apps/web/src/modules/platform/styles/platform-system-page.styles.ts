import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

const panelSx = {
  bgcolor: surface.paper,
  border: '1px solid',
  borderColor: alpha.graphite[6],
  borderRadius: `${radius.sm}px`,
  boxShadow: shadows.propertyCard,
  p: { xs: 1.6, md: 2.2 },
  minWidth: 0,
}

const headingSx = {
  color: brand.graphite[500],
  fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
  fontSize: { xs: 26, sm: 30 },
  fontWeight: 700,
  lineHeight: 1.15,
}

const eyebrowSx = { color: brand.neutral[500], fontSize: 12, fontWeight: 800 }

const cardTitleSx = { color: brand.graphite[500], fontSize: 16, fontWeight: 900, lineHeight: 1.25 }

const valueSx = {
  color: brand.graphite[500],
  fontSize: 29,
  fontWeight: 900,
  lineHeight: 1.1,
  mt: 1.1,
}

const helperSx = { color: brand.neutral[500], fontSize: 12, mt: 1 }

export const styles = {
  box: { width: '100%', p: 3.5 },
  stack: { pb: 1.75, mb: 2.4, borderBottom: '1px solid', borderColor: 'divider' },
  typography: { color: brand.neutral[500], fontSize: 12.5 },
  stack2: { py: 6 },
  typography2: { color: brand.neutral[500], fontSize: 13.5 },
  box2: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
    gap: 2,
  },
  typography3: { color: brand.neutral[500], fontSize: 12 },
  box3: { ...panelSx, p: 0, overflow: 'hidden' },
  box4: { px: 2.25, py: 1.6, borderBottom: '1px solid', borderColor: alpha.graphite[8] },
  box5: { px: 2.25, py: 2.5 },
  typography4: { color: brand.graphite[500], fontSize: 14, fontWeight: 800 },
  typography5: { color: brand.neutral[500], fontSize: 13, mt: 0.5 },
  typography6: { color: brand.neutral[500], fontSize: 13, px: 2.25, py: 2.5 },
  box6: { listStyle: 'none', m: 0, p: 0 },
  stack3: {
    px: 2.25,
    py: 1.4,
    borderBottom: '1px solid',
    borderColor: alpha.graphite[6],
    '&:last-of-type': { borderBottom: 0 },
  },
  chip: { fontWeight: 800, fontSize: 11, minWidth: 64 },
  box7: { minWidth: 0, flex: 1 },
  typography7: {
    color: brand.graphite[500],
    fontSize: 13,
    fontWeight: 700,
    wordBreak: 'break-word',
  },
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.5,
    fontSize: 12.5,
    flexShrink: 0,
  },
  openInNewRoundedIcon: { fontSize: iconSize.xs },
  chip2: { fontWeight: 800, fontSize: 11, height: 22 },
  heading: headingSx,
  panel: panelSx,
  eyebrow: eyebrowSx,
  value: valueSx,
  helper: helperSx,
  cardTitle: cardTitleSx,
} satisfies Record<string, SxProps<Theme>>

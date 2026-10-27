import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

const headingSx = {
  color: brand.graphite[500],
  fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
  fontSize: { xs: 26, sm: 30 },
  fontWeight: 700,
  lineHeight: 1.15,
}

const panelSx = {
  bgcolor: surface.paper,
  border: '1px solid',
  borderColor: alpha.graphite[6],
  borderRadius: `${radius.sm}px`,
  boxShadow: shadows.propertyCard,
  p: { xs: 1.6, md: 2.2 },
  minWidth: 0,
}

const sectionTitleSx = { color: brand.graphite[500], fontSize: 16, fontWeight: 900 }

export const styles = {
  box: { width: '100%', p: 3.5 },
  box2: { pb: 1.75, mb: 2.4, borderBottom: '1px solid', borderColor: 'divider' },
  typography: { color: brand.neutral[500], fontSize: 14, mt: 0.5 },
  stack: { py: 6 },
  typography2: { color: brand.neutral[500], fontSize: 13.5 },
  box3: {
    display: 'grid',
    gridTemplateColumns: {
      xs: 'repeat(2, minmax(0, 1fr))',
      lg: 'repeat(4, minmax(0, 1fr))',
    },
    gap: { xs: 1.2, md: 1.6 },
  },
  stack2: { mt: 2 },
  box4: {
    display: 'grid',
    gridTemplateColumns: {
      xs: 'minmax(0, 1fr) auto auto',
      md: '220px minmax(0, 1fr) 56px 120px',
    },
    columnGap: 2,
    rowGap: 0.8,
    alignItems: 'center',
  },
  typography3: { color: brand.graphite[500], fontSize: 14, fontWeight: 800 },
  typography4: { color: brand.neutral[500], fontSize: 12.5 },
  box5: {
    gridColumn: { xs: '1 / -1', md: 'auto' },
    gridRow: { xs: 2, md: 'auto' },
    height: 8,
    borderRadius: radius.full,
    bgcolor: brand.neutral[100],
  },
  typography5: {
    color: brand.neutral[500],
    fontSize: 13,
    fontWeight: 700,
    textAlign: 'right',
  },
  typography6: {
    color: brand.graphite[500],
    fontSize: 14,
    fontWeight: 800,
    textAlign: 'right',
  },
  box6: { ...panelSx, p: 0, overflow: 'hidden' },
  box7: {
    px: { xs: 1.6, md: 2.2 },
    py: 1.6,
    borderBottom: '1px solid',
    borderColor: alpha.graphite[6],
  },
  typography7: { color: brand.neutral[500], fontSize: 13, px: 2.2, py: 2.2 },
  box8: { listStyle: 'none', m: 0, p: 0 },
  box9: {
    px: 1.6,
    py: 1.6,
    borderBottom: '1px solid',
    borderColor: alpha.graphite[6],
    '&:last-of-type': { borderBottom: 0 },
  },
  stack3: { mt: 1, ml: 5.4 },
  box10: { mt: 1.2, ml: 5.4 },
  tableCell: { minWidth: 220 },
  stack4: { minWidth: 0, flex: 1 },
  avatar: {
    width: 32,
    height: 32,
    bgcolor: alpha.magenta[8],
    color: brand.magenta[500],
    fontSize: 12,
    fontWeight: 800,
  },
  box11: {
    color: brand.graphite[500],
    fontWeight: 700,
    textDecoration: 'none',
    minWidth: 0,
    '&:hover': { color: brand.magenta[500], textDecoration: 'underline' },
  },
  box12: { minWidth: 180 },
  box13: {
    height: 6,
    borderRadius: radius.full,
    bgcolor: brand.neutral[100],
    overflow: 'hidden',
  },
  typography8: { color: brand.neutral[500], fontSize: 12, mt: 0.6 },
  box14: { color: brand.semantic.warning, fontWeight: 800 },
  box15: { textAlign: 'right', whiteSpace: 'nowrap' },
  typography9: { color: brand.neutral[500], fontSize: 11.5 },
  box16: { ...panelSx, p: { xs: 1.45, md: 2.2 } },
  typography10: {
    color: brand.neutral[500],
    fontSize: { xs: 10.5, md: 11 },
    fontWeight: 900,
    letterSpacing: 0.25,
    textTransform: 'uppercase',
  },
  typography11: {
    color: brand.graphite[500],
    fontSize: { xs: 22, sm: 28 },
    fontWeight: 900,
    mt: 0.7,
  },
  typography12: { color: brand.neutral[500], fontSize: 12, mt: 0.3 },
  heading: headingSx,
  panel: panelSx,
  sectionTitle: sectionTitleSx,
} satisfies Record<string, SxProps<Theme>>

export function getBoxStyles({ share }: { share: number }): SxProps<Theme> {
  return {
    width: `${Math.round(share * 100)}%`,
    height: '100%',
    borderRadius: radius.full,
    bgcolor: brand.magenta[500],
  }
}

export function getBoxStyles2({ ratio, over }: { ratio: number; over: boolean }): SxProps<Theme> {
  return {
    width: `${Math.round(ratio * 100)}%`,
    height: '100%',
    borderRadius: radius.full,
    bgcolor: over ? brand.semantic.warning : brand.magenta[500],
  }
}

export function getTypographyStyles({ billed }: { billed: boolean }): SxProps<Theme> {
  return {
    fontSize: 14,
    fontWeight: 800,
    color: billed ? brand.graphite[500] : brand.neutral[500],
  }
}

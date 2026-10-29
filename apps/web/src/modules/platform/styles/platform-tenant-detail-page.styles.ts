import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

const headingSx = {
  color: brand.graphite[500],
  fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
  fontSize: { xs: 24, sm: 28 },
  fontWeight: 700,
  lineHeight: 1.15,
  overflowWrap: 'anywhere',
}

const cardSx = {
  bgcolor: surface.paper,
  borderColor: alpha.graphite[6],
  borderRadius: `${radius.sm}px`,
  boxShadow: shadows.propertyCard,
}

export const styles = {
  box: { width: '100%', p: 3.5 },
  box2: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.6,
    mb: 2,
    color: brand.neutral[500],
    fontSize: 13,
    fontWeight: 700,
    textDecoration: 'none',
    '&:hover': { color: brand.magenta[500] },
  },
  arrowBackRoundedIcon: { fontSize: iconSize.md },
  stack: { py: 6 },
  box3: { ...cardSx, p: 3 },
  typography: { color: brand.graphite[500], fontSize: 18, fontWeight: 900 },
  stack2: { pb: 2, mb: 2.4, borderBottom: '1px solid', borderColor: 'divider' },
  stack3: { minWidth: 0 },
  avatar: {
    width: 56,
    height: 56,
    bgcolor: alpha.magenta[10],
    color: brand.magenta[500],
    fontSize: 20,
    fontWeight: 800,
  },
  stack4: { mt: 0.6 },
  typography2: { color: brand.neutral[500], fontSize: 13, fontFamily: 'monospace' },
  editOutlinedIcon: { fontSize: iconSize.sm },
  button: { alignSelf: { xs: 'flex-start', md: 'center' }, flexShrink: 0 },
  box4: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 380px' },
    gap: 2.4,
    alignItems: 'start',
  },
  box5: { px: 2.2, pt: 2.2, pb: 1.6 },
  typography3: { color: brand.graphite[500], fontSize: 16, fontWeight: 900 },
  typography4: { color: brand.neutral[500], fontSize: 13, mt: 0.3 },
  box6: { px: 2.2, pb: 2.2 },
  typography5: {
    color: brand.graphite[500],
    fontSize: 16,
    fontWeight: 900,
    px: 2.2,
    pt: 2.2,
    pb: 1.4,
  },
  divider: { borderColor: alpha.graphite[6] },
  stack5: { p: 2.2 },
  typography6: { color: brand.neutral[500], fontSize: 12, textAlign: 'right' },
  typography7: { color: brand.neutral[500], fontSize: 13 },
  box7: { color: brand.graphite[500], fontSize: 13.5, fontWeight: 800, textAlign: 'right' },
  heading: headingSx,
  card: cardSx,
} satisfies Record<string, SxProps<Theme>>

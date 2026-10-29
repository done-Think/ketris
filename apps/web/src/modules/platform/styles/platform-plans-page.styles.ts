import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

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
  p: { xs: 2, md: 2.4 },
  minWidth: 0,
}

const iconBoxSx = {
  display: 'grid',
  placeItems: 'center',
  width: 40,
  height: 40,
  flexShrink: 0,
  borderRadius: `${radius.sm}px`,
  bgcolor: alpha.magenta[8],
  color: brand.magenta[500],
}

const priceSx = { color: brand.graphite[500], fontSize: 30, fontWeight: 900, mr: 0.5 }

const featureSx = { color: brand.graphite[500], fontSize: 13.5 }

export const styles = {
  box: { width: '100%', p: 3.5 },
  box2: { pb: 1.75, mb: 2.4, borderBottom: '1px solid', borderColor: 'divider' },
  typography: { color: brand.neutral[500], fontSize: 14, mt: 0.5 },
  stack: { py: 6 },
  typography2: { color: brand.neutral[500], fontSize: 13.5 },
  box3: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
    gap: 2,
  },
  icon: { fontSize: iconSize.xl },
  typography3: { color: brand.graphite[500], fontSize: 17, fontWeight: 900 },
  typography4: { color: brand.neutral[500], fontSize: 14 },
  stack2: { m: 0, pl: 2.2 },
  stack3: {
    pt: 1.4,
    mt: 'auto',
    borderTop: '1px solid',
    borderColor: alpha.graphite[6],
  },
  typography5: { color: brand.neutral[500], fontSize: 12.5, fontWeight: 700 },
  editOutlinedIcon: { fontSize: iconSize.sm },
  typography6: { color: brand.neutral[500], fontSize: 12.5 },
  heading: headingSx,
  panel: panelSx,
  iconBox: iconBoxSx,
  price: priceSx,
  feature: featureSx,
} satisfies Record<string, SxProps<Theme>>

import type { SxProps, Theme } from '@mui/material'
import { brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'
import type { ContractMetricToneStyle } from '../types/contract'

export const styles = {
  box: {
    display: 'grid',
    gridTemplateColumns: {
      xs: 'repeat(3, minmax(0, 1fr))',
      md: 'repeat(3, minmax(0, 1fr))',
    },
    gap: { xs: 0.8, md: 1.9 },
    mb: 2.6,
  } satisfies SxProps<Theme>,
  stack: {
    minWidth: 0,
    overflow: 'hidden',
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    minHeight: { xs: 84, md: 'auto' },
    p: { xs: 1.2, md: 2.2 },
    boxShadow: shadows.crmCardCompact,
  } satisfies SxProps<Theme>,
  stack2: { width: '100%', minWidth: 0, overflow: 'hidden' } satisfies SxProps<Theme>,
  typography: {
    color: brand.neutral[500],
    width: '100%',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: { xs: 10, md: 11 },
    fontWeight: 900,
    textTransform: 'uppercase',
  } satisfies SxProps<Theme>,
  typography2: {
    color: brand.graphite[500],
    fontSize: { xs: 24, md: 28 },
    lineHeight: 1.1,
    fontWeight: 900,
  } satisfies SxProps<Theme>,
  typography3: {
    display: { xs: 'block', md: 'none' },
    width: '100%',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: brand.neutral[500],
    fontSize: 10,
    fontWeight: 700,
    lineHeight: 1.2,
  } satisfies SxProps<Theme>,
  box2: (tone: ContractMetricToneStyle): SxProps<Theme> => ({
    width: 40,
    height: 40,
    borderRadius: radius.full,
    bgcolor: tone.bgcolor,
    color: tone.color,
    display: { xs: 'none', md: 'grid' },
    placeItems: 'center',
    flexShrink: 0,
  }),
  metricIcon: { fontSize: iconSize.md } satisfies SxProps<Theme>,
}

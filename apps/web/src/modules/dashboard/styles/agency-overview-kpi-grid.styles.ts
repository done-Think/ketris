import type { SxProps, Theme } from '@mui/material'

import type { AgencyOverviewKpiTone } from '../types/agency-overview'
import { brand } from '@shared/theme/tokens'

export const styles = {
  box: {
    display: 'grid',
    gridTemplateColumns: {
      xs: 'repeat(2, minmax(0, 1fr))',
      md: 'repeat(3, minmax(0, 1fr))',
      xl: 'repeat(6, minmax(0, 1fr))',
    },
    gap: { xs: 1.2, md: 1.6 },
  },
  box2: {
    display: 'flex',
    minHeight: { xs: 118, md: 122 },
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 1,
    overflow: 'hidden',
    p: { xs: 1.45, md: 2.2 },
  },
  stack: { minWidth: 0 },
  typography: {
    color: brand.neutral[500],
    fontSize: { xs: 10.5, md: 11 },
    fontWeight: 900,
    textTransform: 'uppercase',
  },
  typography2: {
    color: brand.graphite[500],
    fontSize: { xs: 22, sm: 28 },
    fontWeight: 900,
    lineHeight: 1.12,
  },
  box3: { position: 'relative', flexShrink: 0, width: 46, height: 46 },
  circularProgress: { color: brand.magenta[50], position: 'absolute' },
  circularProgress2: { color: brand.magenta[500], position: 'absolute' },
  typography3: {
    display: 'grid',
    width: 46,
    height: 46,
    placeItems: 'center',
    color: brand.magenta[600],
    fontSize: 10,
    fontWeight: 900,
  },
} satisfies Record<string, SxProps<Theme>>

const helperColor: Record<AgencyOverviewKpiTone, string> = {
  neutral: brand.neutral[500],
  success: brand.semantic.success,
  warning: brand.semantic.warning,
}

export function getHelperStyles(tone: AgencyOverviewKpiTone): SxProps<Theme> {
  return {
    color: helperColor[tone],
    fontSize: { xs: 10.5, md: 11 },
    fontWeight: 900,
    lineHeight: 1.25,
  }
}

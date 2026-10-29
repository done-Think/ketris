import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

const panelSx = {
  bgcolor: surface.paper,
  border: '1px solid',
  borderColor: alpha.graphite[6],
  borderRadius: `${radius.sm}px`,
  boxShadow: shadows.propertyCard,
  minWidth: 0,
  minHeight: { lg: 400 },
  p: { xs: 2, md: 2.4 },
}

const titleSx = {
  color: brand.neutral[500],
  fontSize: 11,
  fontWeight: 900,
  mb: 1,
  textTransform: 'uppercase',
}

export const styles = {
  box: { height: { xs: 270, sm: 300, lg: 340 }, width: '100%' },
  panel: panelSx,
  title: titleSx,
} satisfies Record<string, SxProps<Theme>>

export function getLineChartStyles({ isMobile }: { isMobile: boolean }): SxProps<Theme> {
  return {
    '& .MuiChartsAxis-left': { display: 'none' },
    '& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel': {
      fill: brand.neutral[500],
      fontSize: isMobile ? 10 : 12,
    },
    '& .MuiChartsGrid-line': { stroke: alpha.graphite[8] },
  }
}

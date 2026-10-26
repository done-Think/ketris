import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius } from '@shared/theme/tokens'

export const styles = {
  paper: {
    borderRadius: `${radius.sm}px`,
    overflow: 'hidden',
  },
  dialogTitle: { px: { xs: 2, md: 2.6 }, py: 2 },
  box: { minWidth: 0 },
  typography: { color: brand.neutral[500], fontSize: 11, fontWeight: 900 },
  typography2: { color: brand.graphite[500], fontSize: { xs: 20, md: 24 }, fontWeight: 900 },
  dialogContent: { px: { xs: 2, md: 2.6 }, pb: 2.6 },
  box2: {
    border: '1px solid',
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.sm}px`,
    p: 1.6,
  },
  accessTimeOutlinedIcon: { color: brand.magenta[500], fontSize: 19 },
  typography3: { color: brand.graphite[500], fontSize: 16, fontWeight: 900 },
  typography4: { color: brand.graphite[500], fontSize: 14, fontWeight: 900 },
  typography5: { color: brand.graphite[500], fontSize: 13, fontWeight: 700, mt: 0.6 },
  box3: {
    border: '1px solid',
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.sm}px`,
    p: 1.6,
  },
  homeWorkOutlinedIcon: { color: brand.magenta[500], fontSize: 18 },
  typography6: { color: brand.graphite[500], fontSize: 16, fontWeight: 900, mt: 0.8 },
  typography7: { color: brand.neutral[500], fontSize: 12, fontWeight: 700 },
  typography8: { color: brand.magenta[600], fontSize: 14, fontWeight: 900, mt: 0.6 },
} satisfies Record<string, SxProps<Theme>>

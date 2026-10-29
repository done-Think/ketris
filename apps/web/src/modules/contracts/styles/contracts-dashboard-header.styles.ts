import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius, surface } from '@shared/theme/tokens'

export const styles = {
  stack: {
    width: { xs: '100%', md: 'auto' },
    alignItems: { xs: 'stretch', sm: 'center' },
  } satisfies SxProps<Theme>,
  textField: {
    width: { xs: '100%', sm: 280 },
    '& .MuiInputBase-root': {
      height: { xs: 40, sm: 32 },
      borderRadius: `${radius.sm}px`,
      bgcolor: surface.paper,
      color: brand.graphite[500],
      fontSize: 12,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: alpha.graphite[8],
    },
  } satisfies SxProps<Theme>,
  searchRoundedIcon: { color: brand.neutral[400], fontSize: 16 } satisfies SxProps<Theme>,
  addRoundedIcon: { fontSize: 16 } satisfies SxProps<Theme>,
  box: { display: { xs: 'none', md: 'block' } } satisfies SxProps<Theme>,
  dashboardPageHeader: { mb: 2.2 } satisfies SxProps<Theme>,
}

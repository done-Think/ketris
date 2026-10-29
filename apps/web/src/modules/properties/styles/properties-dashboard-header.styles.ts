import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'

export const styles = {
  stack: { width: { xs: '100%', md: 'auto' }, alignItems: { xs: 'stretch', sm: 'center' } },
  box: {
    width: { xs: '100%', sm: 280 },
    flex: { xs: 1, sm: 'initial' },
  },
  textField: {
    width: '100%',
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
  },
  searchRoundedIcon: { color: brand.neutral[400], fontSize: iconSize.sm },
  addRoundedIcon: { fontSize: iconSize.sm },
  box2: { display: { xs: 'none', md: 'block' } },
  dashboardPageHeader: { mb: 2.2 },
} satisfies Record<string, SxProps<Theme>>

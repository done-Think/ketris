import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'

export const styles = {
  actions: { width: { xs: '100%', md: 'auto' }, alignItems: { xs: 'stretch', sm: 'center' } },
  search: {
    width: { xs: '100%', sm: 250 },
    '& .MuiInputBase-root': {
      height: { xs: 40, sm: 32 },
      borderRadius: `${radius.sm}px`,
      bgcolor: surface.paper,
      color: brand.graphite[500],
      fontSize: 12,
    },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha.graphite[8] },
    '& .MuiInputAdornment-root .MuiSvgIcon-root': { fontSize: iconSize.sm },
  },
  desktopOnly: { display: { xs: 'none', md: 'block' } },
} satisfies Record<string, SxProps<Theme>>

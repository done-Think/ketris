import type { SxProps, Theme } from '@mui/material'
import { brand, iconSize, radius } from '@shared/theme/tokens'

export const styles = {
  box: {
    width: 48,
    height: 48,
    display: 'grid',
    placeItems: 'center',
    borderRadius: `${radius.full}px`,
    bgcolor: brand.magenta[50],
  },
  icon: { color: brand.magenta[500], fontSize: iconSize.xl },
} satisfies Record<string, SxProps<Theme>>

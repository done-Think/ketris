import type { SxProps, Theme } from '@mui/material'
import { iconSize } from '@shared/theme/tokens'

export const styles = {
  actions: { width: { xs: '100%', md: 'auto' }, alignItems: { xs: 'stretch', sm: 'center' } },
  icon: { fontSize: iconSize.sm },
  desktopOnly: { display: { xs: 'none', md: 'block' } },
} satisfies Record<string, SxProps<Theme>>

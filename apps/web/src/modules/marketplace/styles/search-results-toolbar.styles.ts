import type { SxProps, Theme } from '@mui/material'
import type { ViewMode } from '../types/search'
import { alpha } from '@shared/theme/tokens'
import { iconSize, radius, surface } from '@shared/theme/tokens'

export const styles = {
  stack: { mb: 2 },
  typography: { color: 'text.secondary', fontWeight: 700, fontSize: 14 },
  textField: {
    minWidth: 190,
    '& .MuiOutlinedInput-root': {
      borderRadius: `${radius.sm}px`,
      bgcolor: surface.paper,
      fontSize: 12,
      fontWeight: 700,
    },
  },
  appsRoundedIcon: { fontSize: iconSize.md },
} satisfies Record<string, SxProps<Theme>>

export function getIconButtonStyles({ viewMode }: { viewMode: ViewMode }): SxProps<Theme> {
  return {
    display: { xs: 'none', md: 'inline-flex' },
    width: 36,
    height: 36,
    borderRadius: `${radius.sm}px`,
    bgcolor: viewMode === 'grid' ? alpha.magenta[8] : 'transparent',
    color: viewMode === 'grid' ? 'primary.main' : 'text.secondary',
  }
}

export function getIconButtonStyles2({ viewMode }: { viewMode: ViewMode }): SxProps<Theme> {
  return {
    display: { xs: 'none', md: 'inline-flex' },
    width: 36,
    height: 36,
    borderRadius: `${radius.sm}px`,
    bgcolor: viewMode === 'list' ? alpha.magenta[8] : 'transparent',
    color: viewMode === 'list' ? 'primary.main' : 'text.secondary',
  }
}

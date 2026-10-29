import type { SxProps, Theme } from '@mui/material'
import type { ViewMode } from '../types/search'
import { surface } from '@shared/theme/tokens'
import { alpha } from '@shared/theme/tokens'
import { radius } from '@shared/theme/tokens'
import { iconSize } from '@shared/theme/tokens'

export const styles = {
  appsRoundedIcon: { fontSize: iconSize.md },
} satisfies Record<string, SxProps<Theme>>

export function getIconButtonStyles({ value }: { value: ViewMode }): SxProps<Theme> {
  return {
    width: 40,
    height: 40,
    borderRadius: `${radius.sm}px`,
    bgcolor: value === 'grid' ? alpha.magenta[8] : surface.paper,
    color: value === 'grid' ? 'primary.main' : 'text.secondary',
    border: '1px solid',
    borderColor: value === 'grid' ? 'primary.main' : 'divider',
  }
}

export function getIconButtonStyles2({ value }: { value: ViewMode }): SxProps<Theme> {
  return {
    width: 40,
    height: 40,
    borderRadius: `${radius.sm}px`,
    bgcolor: value === 'list' ? alpha.magenta[8] : surface.paper,
    color: value === 'list' ? 'primary.main' : 'text.secondary',
    border: '1px solid',
    borderColor: value === 'list' ? 'primary.main' : 'divider',
  }
}

import type { SxProps, Theme } from '@mui/material'
import type { TextSearchFilterKey } from '../types/search'
import type { SelectedSearch } from '../types/search'
import { surface } from '@shared/theme/tokens'
import { alpha } from '@shared/theme/tokens'
import { componentText } from '@shared/theme/tokens'

export const styles = {
  box: { p: 1 },
  box2: { maxHeight: { md: 82, xl: 132 }, overflowY: 'auto', pb: 0.5 },
} satisfies Record<string, SxProps<Theme>>

export function getMenuItemStyles({
  centered,
  selectedSearch,
  filterKey,
  value,
}: {
  centered: boolean
  selectedSearch: SelectedSearch
  filterKey: TextSearchFilterKey
  value: string
}): SxProps<Theme> {
  return {
    color: 'text.primary',
    justifyContent: centered ? 'center' : 'flex-start',
    ...(centered ? componentText.menuItemCentered : componentText.menuItem),
    ...(selectedSearch[filterKey] === value ? componentText.menuItemSelected : {}),
    '&.Mui-selected': {
      bgcolor: alpha.magenta[10],
      color: surface.darkText,
    },
    '&.Mui-selected:hover': {
      bgcolor: alpha.magenta[14],
    },
    '&:hover': {
      bgcolor: alpha.graphite[6],
    },
  }
}

export function getTypographyStyles({ centered }: { centered: boolean }): SxProps<Theme> {
  return {
    color: 'text.secondary',
    px: 2,
    py: 1.5,
    ...(centered ? componentText.menuItemCentered : componentText.menuEmpty),
    textAlign: centered ? 'center' : 'left',
  }
}

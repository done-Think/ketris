import type { SxProps, Theme } from '@mui/material'
import { componentText } from '@shared/theme/tokens'
import { alpha, iconSize, radius, surface } from '@shared/theme/tokens'

export const styles = {
  stack: { mt: 2.4 },
  iconButton: {
    display: { xs: 'inline-flex', lg: 'none' },
    width: 38,
    height: 38,
    borderRadius: radius.full,
    bgcolor: surface.paper,
    boxShadow: `0 8px 20px ${alpha.graphite[8]}`,
  },
  filterListRoundedIcon: { fontSize: iconSize.md },
} satisfies Record<string, SxProps<Theme>>

export function getButtonStyles({ active }: { active: boolean }): SxProps<Theme> {
  return {
    minWidth: 34,
    width: 34,
    height: 34,
    borderRadius: radius.full,
    color: active ? surface.lightText : 'text.secondary',
    bgcolor: active ? 'primary.main' : 'transparent',
    ...componentText.resetButtonText,
    '&:hover': {
      bgcolor: active ? 'primary.dark' : alpha.magenta[6],
    },
  }
}

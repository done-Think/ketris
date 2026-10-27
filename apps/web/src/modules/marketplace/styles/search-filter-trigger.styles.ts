import type { SxProps, Theme } from '@mui/material'
import { alpha, componentText, iconSize, radius } from '@shared/theme/tokens'

export const styles = {
  keyboardArrowDownIcon: { fontSize: iconSize.lg },
  button: {
    justifyContent: 'space-between',
    alignItems: 'center',
    minWidth: 0,
    minHeight: { md: 40, xl: 55 },
    px: { xs: 1, md: 1.25, xl: 2 },
    py: { md: 0.35, xl: 0.6 },
    color: 'text.primary',
    borderRadius: `${radius.sm}px`,
    textAlign: 'left',
    ...componentText.resetButtonText,
    '& .MuiButton-endIcon': {
      color: 'text.disabled',
      ml: 1,
    },
    '&:hover': {
      bgcolor: alpha.magenta[6],
    },
  },
  box: { minWidth: 0 },
  typography: {
    color: 'text.disabled',
    ...componentText.filterLabel,
  },
  typography2: {
    color: 'text.primary',
    ...componentText.filterValue,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
} satisfies Record<string, SxProps<Theme>>

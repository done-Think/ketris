import type { SxProps, Theme } from '@mui/material'
import { brand, iconSize } from '@shared/theme/tokens'

export const styles = {
  container: { p: 3.5 },
  box: {
    alignSelf: 'flex-start',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.6,
    color: brand.neutral[500],
    fontSize: 13,
    fontWeight: 700,
    textDecoration: 'none',
    '&:hover': { color: brand.magenta[500] },
  },
  arrowBackRoundedIcon: { fontSize: iconSize.md },
} satisfies Record<string, SxProps<Theme>>

import type { SxProps, Theme } from '@mui/material'
import { brand, iconSize } from '@shared/theme/tokens'

export const styles = {
  paper: { minHeight: { sm: 640 } } satisfies SxProps<Theme>,
  dialogTitle: { px: { xs: 2, md: 2.8 }, pb: 1.4, pt: 2.4 } satisfies SxProps<Theme>,
  box: { minWidth: 0 } satisfies SxProps<Theme>,
  typography: { color: brand.magenta[600], fontSize: 13, fontWeight: 900 } satisfies SxProps<Theme>,
  typography2: {
    color: brand.graphite[500],
    fontSize: 22,
    fontWeight: 900,
  } satisfies SxProps<Theme>,
  closeRoundedIcon: { fontSize: iconSize.lg } satisfies SxProps<Theme>,
  dialogContent: {
    mt: 1.6,
    overflow: 'visible',
    px: { xs: 2, md: 2.8 },
    pb: 2,
    pt: 2.4,
  } satisfies SxProps<Theme>,
  dialogActions: { px: { xs: 2, md: 2.8 }, pb: 2.5, pt: 0 } satisfies SxProps<Theme>,
}

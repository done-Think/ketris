import type { SxProps, Theme } from '@mui/material'
import { iconSize } from '@shared/theme/tokens'

export const styles = {
  dialogTitle: { px: { xs: 2, md: 2.8 }, pb: 1.4, pt: 2.4 },
  typography: { color: 'text.primary', fontSize: 24, fontWeight: 900 },
  typography2: { color: 'text.secondary', fontSize: 14, mt: 0.5 },
  closeRoundedIcon: { fontSize: iconSize.lg },
  dialogContent: { px: { xs: 2, md: 2.8 }, pb: 2 },
  stack: { pt: 1 },
  dialogActions: { px: { xs: 2, md: 2.8 }, pb: 2.5, pt: 0 },
} satisfies Record<string, SxProps<Theme>>

import type { SxProps, Theme } from '@mui/material'
import { radius } from '@shared/theme/tokens'

export const styles = {
  honeypot: { position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' },
  paper: { borderRadius: `${radius.sm}px` },
  dialogActions: { px: 3, pb: 2.5, pt: 0 },
} satisfies Record<string, SxProps<Theme>>

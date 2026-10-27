import type { SxProps, Theme } from '@mui/material'
import { radius } from '@shared/theme/tokens'

export const styles = {
  paper: { borderRadius: `${radius.sm}px` },
  dialogActions: { px: 3, pb: 2.5, pt: 0 },
} satisfies Record<string, SxProps<Theme>>

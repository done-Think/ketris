import type { SxProps, Theme } from '@mui/material'
import { radius } from '@shared/theme/tokens'

export const interactionStyles = {
  item: { p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: `${radius.sm}px` },
  description: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
  heading: { fontWeight: 700 },
  metadata: { color: 'text.secondary' },
  dialogTitle: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 },
} satisfies Record<string, SxProps<Theme>>

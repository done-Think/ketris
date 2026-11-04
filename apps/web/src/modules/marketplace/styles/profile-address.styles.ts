import type { SxProps, Theme } from '@mui/material'

export const styles = {
  actions: { mt: 1.5, flexWrap: 'wrap', gap: 1 },
  link: { overflowWrap: 'anywhere' },
  hint: { mt: 1, color: 'text.secondary' },
  field: { mt: 1 },
} satisfies Record<string, SxProps<Theme>>

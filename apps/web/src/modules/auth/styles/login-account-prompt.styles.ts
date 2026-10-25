import type { SxProps, Theme } from '@mui/material'
import { componentText } from '@shared/theme/tokens'

export const styles = {
  typography: {
    color: 'text.secondary',
    ...componentText.authPrompt,
  },
  muiLink: { color: 'primary.main', ...componentText.authPrompt, fontWeight: 700 },
} satisfies Record<string, SxProps<Theme>>

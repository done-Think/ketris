import type { SxProps, Theme } from '@mui/material'
import { componentText } from '@shared/theme/tokens'

export const styles = {
  muiLink: { color: 'primary.main', ...componentText.authCompactBody, fontWeight: 700 },
  alert: { mb: 2 },
  alert2: { mb: 2 },
} satisfies Record<string, SxProps<Theme>>

import type { SxProps, Theme } from '@mui/material'
import { componentText } from '@shared/theme/tokens'

export const styles = {
  box: { mb: { xs: 2, md: 3.25 }, textAlign: { xs: 'center', md: 'left' } },
  typography: { mb: 0.5, ...componentText.authTitle },
  alert: { mt: 0.75 },
  typography2: { mt: { xs: 2.5, md: 3 }, ...componentText.authBody },
} satisfies Record<string, SxProps<Theme>>

import type { SxProps, Theme } from '@mui/material'
import { componentText, radius } from '@shared/theme/tokens'

export const styles = {
  box: { px: 1.3, py: 1.5 },
  stack: { mb: 1.5 },
  typography: { color: 'text.primary', ...componentText.menuTitle },
  stack2: { mb: 2 },
  textField: { '& .MuiInputBase-input': { px: 1.2 } },
  box2: { px: 1 },
  stack3: { mt: 0.5 },
  typography2: { color: 'text.secondary', ...componentText.menuCaption },
  button: { mt: 1.8, minHeight: 38, borderRadius: `${radius.sm}px` },
} satisfies Record<string, SxProps<Theme>>

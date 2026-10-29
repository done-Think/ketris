import type { SxProps, Theme } from '@mui/material'
import { brand } from '@shared/theme/tokens'

export const styles = {
  box: { width: '100%', p: 3.5 },
  stack: {
    pb: 1.75,
    mb: 2.4,
    borderBottom: '1px solid',
    borderColor: 'divider',
  },
  typography: {
    color: brand.graphite[500],
    fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
    fontSize: { xs: 26, sm: 30 },
    fontWeight: 700,
    lineHeight: 1.15,
  },
  typography2: { color: brand.neutral[500], fontSize: 14, mt: 0.5 },
  stack2: { width: { xs: '100%', lg: 'auto' } },
} satisfies Record<string, SxProps<Theme>>

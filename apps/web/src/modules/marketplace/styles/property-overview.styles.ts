import type { SxProps, Theme } from '@mui/material'
import { componentText, iconSize, radius, surface } from '@shared/theme/tokens'

export const styles = {
  stack: { mb: 1 },
  typography: { color: 'primary.main', ...componentText.cardEyebrow },
  typography2: { color: 'text.secondary', fontSize: 12, fontWeight: 700 },
  typography3: { maxWidth: 760, mb: 2 },
  stack2: {
    display: { xs: 'flex', lg: 'none' },
    mb: 3,
  },
  box: {
    display: 'grid',
    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
    gap: 1,
    mb: 4,
  },
  box2: {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    px: 2,
    py: 1.8,
  },
  icon: { color: 'primary.main', fontSize: iconSize.lg, mb: 0.6 },
  typography4: { fontSize: 13, fontWeight: 700 },
  typography5: { mb: 1.2 },
  typography6: { color: 'text.secondary', maxWidth: 820, mb: 4 },
  typography7: { color: 'text.secondary', mb: 1.4, fontWeight: 700 },
} satisfies Record<string, SxProps<Theme>>

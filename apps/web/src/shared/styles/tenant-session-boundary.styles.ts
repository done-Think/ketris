import { alpha, radius, surface } from '@shared/theme/tokens'

export const styles = {
  stack: { minHeight: '55vh' },
  stack2: { minHeight: '55vh', textAlign: 'center' },
  box: {
    display: 'grid',
    placeItems: 'center',
    width: 52,
    height: 52,
    borderRadius: `${radius.md}px`,
    bgcolor: alpha.magenta[10],
    color: 'primary.main',
  },
  typography: { mb: 0.5 },
  typography2: { maxWidth: 430 },
  box2: { minHeight: '100%', bgcolor: surface.app },
} as const

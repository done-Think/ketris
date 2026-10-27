import type { SxProps, Theme } from '@mui/material'
import { alpha, componentText, gradients, surface, zIndex } from '@shared/theme/tokens'

export const styles = {
  box: {
    position: 'relative',
    zIndex: zIndex.hero,
    color: surface.lightText,
    minHeight: { xs: 332, md: 315, xl: 455 },
    display: 'flex',
    alignItems: 'center',
    overflow: 'visible',
    width: '100%',
    backgroundColor: surface.darkDeep,
    backgroundImage: gradients.heroBackground(
      'https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=1800&q=80',
    ),
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  box2: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 3fr) minmax(0, 2fr)' },
    alignItems: 'center',
    gap: { xs: 2.4, lg: 4, xl: 7 },
    py: { xs: 2.5, md: 4.2, xl: 8 },
    isolation: 'isolate',
    textAlign: { xs: 'center', md: 'left' },
  },
  box3: { position: 'relative', zIndex: zIndex.content },
  typography: {
    maxWidth: { xs: 420, md: 700, xl: 760 },
    color: surface.lightText,
    ...componentText.heroTitle,
    mb: { xs: 0.9, md: 1.7, xl: 2.5 },
    mx: { xs: 'auto', md: 0 },
  },
  box4: { display: 'block' },
  typography2: {
    color: alpha.white[72],
    mb: { xs: 1.5, md: 3, xl: 4.8 },
    maxWidth: { xs: 360, md: 690, xl: 760 },
    ...componentText.heroSubtitle,
    mx: { xs: 'auto', md: 0 },
    whiteSpace: { md: 'nowrap' },
  },
} satisfies Record<string, SxProps<Theme>>

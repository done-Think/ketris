import type { SxProps, Theme } from '@mui/material'
import { brand, gradients, iconSize, radius, surface } from '@shared/theme/tokens'

export const styles = {
  box: {
    minHeight: { xs: 'auto', md: '100dvh' },
    px: { xs: 2.5, sm: 4, md: 6.5 },
    py: { xs: 2.5, md: 6.5 },
    display: 'flex',
    flexDirection: 'column',
    bgcolor: surface.app,
  },
  box2: {
    flex: 1,
    display: { xs: 'none', md: 'flex' },
    flexDirection: 'column',
    justifyContent: 'center',
  },
  box3: {
    width: 280,
    height: 180,
    borderRadius: `${radius.xl}px`,
    background: gradients.registrationHighlight,
  },
  stack: { mt: 5 },
  box4: {
    width: 24,
    height: 24,
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    borderRadius: `${radius.full}px`,
    bgcolor: brand.magenta[50],
  },
  checkRoundedIcon: { color: brand.magenta[500], fontSize: iconSize.sm },
  typography: { fontSize: 15 },
  typography2: { display: { xs: 'none', md: 'block' } },
} satisfies Record<string, SxProps<Theme>>

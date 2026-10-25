import type { SxProps, Theme } from '@mui/material'
import { brand, componentText, radius } from '@shared/theme/tokens'

export const styles = {
  box: { textAlign: 'center', mt: 4 },
  box2: {
    width: 52,
    height: 52,
    mx: 'auto',
    display: 'grid',
    placeItems: 'center',
    borderRadius: `${radius.full}px`,
    bgcolor: brand.magenta[50],
  },
  markEmailReadOutlinedIcon: { color: 'primary.main', fontSize: 28 },
  typography: { mt: 2, mb: 0.5 },
  typography2: { maxWidth: 420, mx: 'auto' },
  box3: { mt: 3, maxWidth: 280, mx: 'auto' },
  muiLink: { color: 'text.secondary', ...componentText.authCompactBody },
} satisfies Record<string, SxProps<Theme>>

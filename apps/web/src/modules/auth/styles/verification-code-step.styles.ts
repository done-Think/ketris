import type { SxProps, Theme } from '@mui/material'
import { brand, componentText, radius } from '@shared/theme/tokens'

export const styles = {
  box: { display: 'flex', justifyContent: 'center' },
  box2: {
    width: { xs: 36, md: 60 },
    height: { xs: 36, md: 60 },
    display: { xs: 'none', md: 'grid' },
    placeItems: 'center',
    borderRadius: `${radius.full}px`,
    bgcolor: brand.magenta[50],
  },
  markEmailReadOutlinedIcon: { color: 'primary.main', fontSize: { xs: 18, md: 28 } },
  box3: { mt: { xs: 2, md: 4 }, textAlign: 'center' },
  typography: { mt: 0.5, ...componentText.authCompactBody },
  stack: { mt: { xs: 2, md: 3 } },
} satisfies Record<string, SxProps<Theme>>

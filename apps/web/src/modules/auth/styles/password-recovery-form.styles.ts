import type { SxProps, Theme } from '@mui/material'
import { brand, componentText, radius } from '@shared/theme/tokens'

export const styles = {
  emailField: {
    '& .MuiOutlinedInput-root': { height: { xs: 30, md: 42 } },
    '& .MuiInputBase-input': {
      px: { xs: 1.25, md: 1.75 },
      py: { xs: 0.75, md: 1.5 },
      ...componentText.authCompactBody,
    },
  },
  submitButton: {
    height: { xs: 30, md: 46 },
    mt: { xs: 2, md: 3.25 },
    ...componentText.authCompactBody,
  },
  box: { display: 'flex', justifyContent: 'center' },
  box2: {
    width: { xs: 36, md: 60 },
    height: { xs: 36, md: 60 },
    display: { xs: 'none', md: 'grid' },
    placeItems: 'center',
    borderRadius: `${radius.full}px`,
    bgcolor: brand.magenta[50],
  },
  lockOutlinedIcon: { color: 'primary.main', fontSize: { xs: 18, md: 28 } },
  box3: { mt: { xs: 2, md: 4 }, textAlign: 'center' },
  typography: { mt: 0.5, ...componentText.authCompactBody },
  box4: { mt: { xs: 1.5, md: 2.5 } },
} satisfies Record<string, SxProps<Theme>>

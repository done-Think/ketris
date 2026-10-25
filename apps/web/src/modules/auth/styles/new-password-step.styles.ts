import type { SxProps, Theme } from '@mui/material'
import { brand, componentText, radius } from '@shared/theme/tokens'
import { authPrimaryButtonSx, authTextFieldSx } from '@shared/components/form/auth-form.styles'

export const styles = {
  iconButton: { color: brand.neutral[500] },
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
  box5: { mt: 1.5 },
  button: {
    ...authPrimaryButtonSx,
    height: { xs: 30, md: 46 },
    mt: { xs: 2, md: 3.25 },
    ...componentText.authCompactBody,
  },
} satisfies Record<string, SxProps<Theme>>

export const newPasswordTextFieldSx = {
  ...authTextFieldSx,
  '& .MuiOutlinedInput-root': {
    ...authTextFieldSx['& .MuiOutlinedInput-root'],
    height: { xs: 38, md: 46 },
  },
  '& .MuiInputBase-input': {
    ...authTextFieldSx['& .MuiInputBase-input'],
    py: { xs: 1, md: 1.5 },
  },
} as const

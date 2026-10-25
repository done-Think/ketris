import type { SxProps, Theme } from '@mui/material'
import { alpha as muiAlpha } from '@mui/material/styles'
import { brand, componentText, radius } from '@shared/theme/tokens'
import { authPrimaryButtonSx } from '@shared/components/form/auth-form.styles'

export const styles = {
  box: { textAlign: 'center' },
  box2: {
    width: { xs: 36, md: 60 },
    height: { xs: 36, md: 60 },
    mx: 'auto',
    display: 'grid',
    placeItems: 'center',
    borderRadius: `${radius.full}px`,
    bgcolor: muiAlpha(brand.semantic.success, 0.08),
  },
  checkRoundedIcon: { color: brand.semantic.success, fontSize: { xs: 18, md: 28 } },
  box3: { mt: { xs: 2, md: 4 } },
  typography: { mt: 0.5, ...componentText.authCompactBody },
  button: {
    ...authPrimaryButtonSx,
    height: { xs: 30, md: 46 },
    mt: { xs: 2, md: 3.25 },
    ...componentText.authCompactBody,
  },
} satisfies Record<string, SxProps<Theme>>

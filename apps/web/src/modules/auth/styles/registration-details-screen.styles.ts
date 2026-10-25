import type { SxProps, Theme } from '@mui/material'
import { alpha as muiAlpha } from '@mui/material/styles'
import { brand, radius } from '@shared/theme/tokens'
import { authPrimaryButtonSx } from '@shared/components/form/auth-form.styles'

export const styles = {
  box: { textAlign: 'center', mt: 4 },
  box2: {
    width: 52,
    height: 52,
    mx: 'auto',
    display: 'grid',
    placeItems: 'center',
    borderRadius: `${radius.full}px`,
    bgcolor: muiAlpha(brand.semantic.success, 0.08),
  },
  checkRoundedIcon: { color: brand.semantic.success, fontSize: 28 },
  typography: { mt: 2, mb: 0.5 },
  typography2: { maxWidth: 420, mx: 'auto' },
  button: { ...authPrimaryButtonSx, mt: 3 },
  alert: { mt: 3 },
} satisfies Record<string, SxProps<Theme>>

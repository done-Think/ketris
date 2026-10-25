import type { SxProps, Theme } from '@mui/material'
import { brand } from '@shared/theme/tokens'
import { authPrimaryButtonSx } from '@shared/components/form/auth-form.styles'

export const styles = {
  box: { mt: 4 },
  box2: { display: 'grid', gap: 2.25 },
  box3: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1.35fr) minmax(0, 0.85fr)' },
    gap: 2,
  },
  box4: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
    gap: 2,
  },
  iconButton: { color: brand.neutral[500] },
  formControl: { mt: 2.25 },
  checkbox: { p: 0, mr: 1.25, color: brand.neutral[200] },
  box5: { color: 'primary.main' },
  box6: { color: 'primary.main' },
  formControlLabel: { m: 0, alignItems: 'center' },
  formHelperText: { ml: 0 },
  button: {
    ...authPrimaryButtonSx,
    width: '100%',
    maxWidth: 286,
    mt: 3.25,
  },
} satisfies Record<string, SxProps<Theme>>

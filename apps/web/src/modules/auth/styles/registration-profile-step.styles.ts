import type { SxProps, Theme } from '@mui/material'
import { authPrimaryButtonSx } from '@shared/components/form/auth-form.styles'

export const styles = {
  box: { flex: 1, display: 'flex', flexDirection: 'column' },
  box2: { mt: { xs: 4, sm: 5 }, textAlign: 'center' },
  typography: { mt: 0.75 },
  radioGroup: {
    mt: { xs: 4, sm: 5.5 },
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 2,
  },
  button: {
    ...authPrimaryButtonSx,
    width: '100%',
    maxWidth: 334,
    mt: { xs: 5, md: 'auto' },
    mx: 'auto',
  },
} satisfies Record<string, SxProps<Theme>>

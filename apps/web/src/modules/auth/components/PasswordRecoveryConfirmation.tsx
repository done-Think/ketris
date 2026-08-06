import Link from 'next/link'
import { Box, Button, Typography } from '@mui/material'
import { alpha as muiAlpha } from '@mui/material/styles'

import { brand, radius } from '@shared/theme/tokens'

import { authPrimaryButtonSx } from './auth-form.styles'

export function PasswordRecoveryConfirmation() {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box
        aria-hidden="true"
        sx={{
          width: 60,
          height: 60,
          mx: 'auto',
          display: 'grid',
          placeItems: 'center',
          borderRadius: `${radius.full}px`,
          bgcolor: muiAlpha(brand.semantic.success, 0.08),
        }}
      />

      <Box sx={{ mt: 4 }}>
        <Typography variant="h3">E-mail enviado!</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
          Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
        </Typography>
      </Box>

      <Button
        component={Link}
        href="/login"
        variant="contained"
        size="large"
        fullWidth
        sx={{ ...authPrimaryButtonSx, height: 46, mt: 3.25 }}
      >
        Voltar ao login
      </Button>
    </Box>
  )
}

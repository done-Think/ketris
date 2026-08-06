import Link from 'next/link'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
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
          width: { xs: 36, md: 60 },
          height: { xs: 36, md: 60 },
          mx: 'auto',
          display: 'grid',
          placeItems: 'center',
          borderRadius: `${radius.full}px`,
          bgcolor: muiAlpha(brand.semantic.success, 0.08),
        }}
      >
        <CheckRoundedIcon
          sx={{ display: { xs: 'block', md: 'none' }, color: brand.semantic.success, fontSize: 18 }}
        />
      </Box>

      <Box sx={{ mt: { xs: 2, md: 4 } }}>
        <Typography variant="h3" sx={{ fontSize: { xs: 16, md: '1.625rem' } }}>
          E-mail enviado!
        </Typography>
        <Typography
          color="text.secondary"
          variant="body2"
          sx={{ display: { xs: 'none', md: 'block' }, mt: 0.5 }}
        >
          Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
        </Typography>
        <Typography
          color="text.secondary"
          variant="body2"
          sx={{ display: { xs: 'block', md: 'none' }, mt: 0.5, fontSize: 10 }}
        >
          Enviamos as instruções para o seu e-mail.
        </Typography>
      </Box>

      <Button
        component={Link}
        href="/login"
        variant="contained"
        size="large"
        fullWidth
        sx={[
          authPrimaryButtonSx,
          {
            height: { xs: 30, md: 46 },
            mt: { xs: 2, md: 3.25 },
            fontSize: { xs: 10, md: 14 },
          },
        ]}
      >
        Voltar ao login
      </Button>
    </Box>
  )
}

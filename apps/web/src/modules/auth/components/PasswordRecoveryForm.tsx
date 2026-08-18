'use client'

import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { Box, Button, Typography } from '@mui/material'

import { RhfTextField } from '@shared/components/form'
import { brand, componentText, radius } from '@shared/theme/tokens'

import { AuthFormField } from './AuthFormField'
import { authPrimaryButtonSx, authTextFieldSx } from './auth-form.styles'
import type { PasswordRecoveryFormProps } from '../types/password-recovery'

export function PasswordRecoveryForm({
  control,
  isSubmitting,
  onSubmit,
}: PasswordRecoveryFormProps) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box
          aria-hidden="true"
          sx={{
            width: { xs: 36, md: 60 },
            height: { xs: 36, md: 60 },
            display: 'grid',
            placeItems: 'center',
            borderRadius: `${radius.full}px`,
            bgcolor: brand.magenta[50],
          }}
        >
          <LockOutlinedIcon sx={{ color: 'primary.main', fontSize: { xs: 18, md: 28 } }} />
        </Box>
      </Box>

      <Box sx={{ mt: { xs: 2, md: 4 }, textAlign: 'center' }}>
        <Typography variant="h3" sx={componentText.authCompactTitle}>
          Recuperar senha
        </Typography>
        <Typography
          color="text.secondary"
          variant="body2"
          sx={{ mt: 0.5, ...componentText.authCompactBody }}
        >
          Digite seu e-mail para redefinir sua senha
        </Typography>
      </Box>

      <Box component="form" noValidate onSubmit={onSubmit} sx={{ mt: { xs: 1.5, md: 2.5 } }}>
        <AuthFormField
          htmlFor="password-recovery-email"
          label="E-mail"
          labelSx={componentText.authCompactBody}
        >
          <RhfTextField
            id="password-recovery-email"
            control={control}
            name="email"
            placeholder="seu@email.com"
            type="email"
            autoComplete="email"
            fullWidth
            sx={[
              authTextFieldSx,
              {
                '& .MuiOutlinedInput-root': { height: { xs: 30, md: 42 } },
                '& .MuiInputBase-input': {
                  px: { xs: 1.25, md: 1.75 },
                  py: { xs: 0.75, md: 1.5 },
                  ...componentText.authCompactBody,
                },
              },
            ]}
          />
        </AuthFormField>

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={isSubmitting}
          sx={[
            authPrimaryButtonSx,
            {
              height: { xs: 30, md: 46 },
              mt: { xs: 2, md: 3.25 },
              ...componentText.authCompactBody,
            },
          ]}
        >
          Enviar instruções
        </Button>
      </Box>
    </Box>
  )
}

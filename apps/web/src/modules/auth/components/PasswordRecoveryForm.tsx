'use client'

import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { Box, Button, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'
import { brand, radius } from '@shared/theme/tokens'

import { AuthFormField } from './AuthFormField'
import { authPrimaryButtonSx, authTextFieldSx } from './auth-form.styles'
import {
  passwordRecoverySchema,
  type PasswordRecoveryFormValues,
} from '../schemas/password-recovery-schema'

const PASSWORD_RECOVERY_SENT_ROUTE = '/recuperar-senha/email-enviado'

export function PasswordRecoveryForm() {
  const router = useRouter()
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<PasswordRecoveryFormValues>({
    resolver: zodResolver(passwordRecoverySchema),
    defaultValues: { email: '' },
  })

  function submitRecoveryRequest() {
    router.push(PASSWORD_RECOVERY_SENT_ROUTE)
  }

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
          <LockOutlinedIcon
            sx={{ display: { xs: 'block', md: 'none' }, color: 'primary.main', fontSize: 18 }}
          />
          <Box
            sx={{
              width: 21,
              height: 21,
              display: { xs: 'none', md: 'block' },
              borderRadius: `${radius.full}px`,
              bgcolor: brand.magenta[500],
            }}
          />
        </Box>
      </Box>

      <Box sx={{ mt: { xs: 2, md: 4 }, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ fontSize: { xs: 16, md: '1.625rem' } }}>
          Recuperar senha
        </Typography>
        <Typography
          color="text.secondary"
          variant="body2"
          sx={{ mt: 0.5, fontSize: { xs: 10, md: 14 } }}
        >
          Digite seu e-mail para redefinir sua senha
        </Typography>
      </Box>

      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(submitRecoveryRequest)}
        sx={{ mt: { xs: 1.5, md: 2.5 } }}
      >
        <AuthFormField
          htmlFor="password-recovery-email"
          label="E-mail"
          labelSx={{ fontSize: { xs: 10, md: 14 } }}
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
                  fontSize: { xs: 10, md: 14 },
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
              fontSize: { xs: 10, md: 14 },
            },
          ]}
        >
          Enviar instruções
        </Button>
      </Box>
    </Box>
  )
}

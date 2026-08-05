'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Box, Button, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'
import { brand, radius } from '@shared/theme/tokens'

import { AuthFormField } from './AuthFormField'
import { authPrimaryButtonSx, authTextFieldSx } from './auth-form.styles'
import {
  passwordRecoverySchema,
  type PasswordRecoveryFormValues,
} from '../schemas/password-recovery-schema'

const RECOVERY_AVAILABILITY_MESSAGE =
  'E-mail validado. O envio das instruções será habilitado quando o serviço de recuperação estiver disponível.'

export function PasswordRecoveryForm() {
  const [feedback, setFeedback] = useState<string | null>(null)
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<PasswordRecoveryFormValues>({
    resolver: zodResolver(passwordRecoverySchema),
    defaultValues: { email: '' },
  })

  function submitRecoveryRequest() {
    setFeedback(RECOVERY_AVAILABILITY_MESSAGE)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box
          aria-hidden="true"
          sx={{
            width: 60,
            height: 60,
            display: 'grid',
            placeItems: 'center',
            borderRadius: `${radius.full}px`,
            bgcolor: brand.magenta[50],
          }}
        >
          <Box
            sx={{
              width: 21,
              height: 21,
              borderRadius: `${radius.full}px`,
              bgcolor: brand.magenta[500],
            }}
          />
        </Box>
      </Box>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h3">Recuperar senha</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
          Digite seu e-mail para redefinir sua senha
        </Typography>
      </Box>

      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(submitRecoveryRequest)}
        sx={{ mt: 2.5 }}
      >
        <AuthFormField htmlFor="password-recovery-email" label="E-mail">
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
                '& .MuiOutlinedInput-root': { height: 42 },
              },
            ]}
          />
        </AuthFormField>

        {feedback && (
          <Alert severity="info" role="status" sx={{ mt: 2 }}>
            {feedback}
          </Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={isSubmitting}
          sx={{ ...authPrimaryButtonSx, height: 46, mt: 3.25 }}
        >
          Enviar instruções
        </Button>
      </Box>
    </Box>
  )
}

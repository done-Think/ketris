'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Link as MuiLink } from '@mui/material'
import Link from 'next/link'
import { useForm } from 'react-hook-form'

import { componentText } from '@shared/theme/tokens'

import { AuthShell } from './AuthShell'
import { PasswordRecoveryConfirmation } from './PasswordRecoveryConfirmation'
import { PasswordRecoveryForm } from './PasswordRecoveryForm'
import { authRoutes } from '../config/auth-routes'
import { passwordRecoverySchema } from '../schemas/password-recovery-schema'
import type { PasswordRecoveryFormValues } from '../types/password-recovery'

export function PasswordRecoveryScreen() {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isSubmitSuccessful },
  } = useForm<PasswordRecoveryFormValues>({
    resolver: zodResolver(passwordRecoverySchema),
    defaultValues: { email: '' },
  })

  const requestRecovery = handleSubmit(() => {})

  return (
    <AuthShell
      brandDescription={
        isSubmitSuccessful
          ? 'Enviamos um link de recuperação para seu e-mail cadastrado'
          : 'Recupere o acesso à sua carteira de imóveis e clientes'
      }
      contentMaxWidth={354}
      contentPaddingTop={isSubmitSuccessful ? 6.5 : 7.5}
      mobileVariant="backdrop"
      footer={
        isSubmitSuccessful ? undefined : (
          <MuiLink
            component={Link}
            href={authRoutes.login}
            underline="hover"
            sx={{ color: 'primary.main', ...componentText.authCompactBody, fontWeight: 700 }}
          >
            Voltar ao login
          </MuiLink>
        )
      }
    >
      {isSubmitSuccessful ? (
        <PasswordRecoveryConfirmation onResend={() => requestRecovery()} />
      ) : (
        <PasswordRecoveryForm
          control={control}
          isSubmitting={isSubmitting}
          onSubmit={requestRecovery}
        />
      )}
    </AuthShell>
  )
}

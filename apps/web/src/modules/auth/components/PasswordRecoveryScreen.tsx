'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Link as MuiLink } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

import { Link } from '@/i18n/navigation'
import { componentText } from '@shared/theme/tokens'

import { AuthShell } from './AuthShell'
import { NewPasswordStep } from './NewPasswordStep'
import { PasswordRecoveryConfirmation } from './PasswordRecoveryConfirmation'
import { PasswordRecoveryForm } from './PasswordRecoveryForm'
import { VerificationCodeStep } from './VerificationCodeStep'
import { authRoutes } from '../config/auth-routes'
import { usePasswordReset } from '../hooks/use-password-reset'
import { passwordRecoverySchema, passwordResetSchema } from '../schemas/password-recovery-schema'
import type {
  PasswordRecoveryFormValues,
  PasswordResetFormValues,
} from '../types/password-recovery'

type RecoveryStep = 'request' | 'code' | 'newPassword' | 'done'

export function PasswordRecoveryScreen() {
  const t = useTranslations('auth.passwordRecovery')
  const [step, setStep] = useState<RecoveryStep>('request')
  const [email, setEmail] = useState('')
  const { error, resetPassword } = usePasswordReset()

  const requestForm = useForm<PasswordRecoveryFormValues>({
    resolver: zodResolver(passwordRecoverySchema),
    defaultValues: { email: '' },
  })

  const resetForm = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { code: '', password: '', passwordConfirmation: '' },
  })

  const requestRecovery = requestForm.handleSubmit((values) => {
    setEmail(values.email)
    setStep('code')
  })

  const submitReset = resetForm.handleSubmit(async (values) => {
    const succeeded = await resetPassword({
      email,
      code: values.code,
      password: values.password,
    })

    if (succeeded) setStep('done')
  })

  function resendCode() {}

  return (
    <AuthShell
      brandDescription={step === 'request' ? t('brandDescription') : t('successBrandDescription')}
      contentMaxWidth={560}
      mobileVariant="backdrop"
      footer={
        step === 'done' ? undefined : (
          <MuiLink
            component={Link}
            href={authRoutes.login}
            underline="hover"
            sx={{ color: 'primary.main', ...componentText.authCompactBody, fontWeight: 700 }}
          >
            {t('backToLogin')}
          </MuiLink>
        )
      }
    >
      {step === 'request' ? (
        <PasswordRecoveryForm
          control={requestForm.control}
          isSubmitting={requestForm.formState.isSubmitting}
          onSubmit={requestRecovery}
        />
      ) : step === 'code' ? (
        <VerificationCodeStep
          control={resetForm.control}
          onCodeComplete={() => setStep('newPassword')}
          onResend={resendCode}
        />
      ) : step === 'newPassword' ? (
        <>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}
          <NewPasswordStep
            control={resetForm.control}
            isSubmitting={resetForm.formState.isSubmitting}
            onSubmit={submitReset}
          />
        </>
      ) : (
        <PasswordRecoveryConfirmation />
      )}
    </AuthShell>
  )
}

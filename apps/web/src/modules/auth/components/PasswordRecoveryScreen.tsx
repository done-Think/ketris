'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link as MuiLink } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

import { Link } from '@/i18n/navigation'
import { componentText } from '@shared/theme/tokens'

import { AuthShell } from './AuthShell'
import { PasswordRecoveryConfirmation } from './PasswordRecoveryConfirmation'
import { PasswordRecoveryForm } from './PasswordRecoveryForm'
import { PasswordResetForm } from './PasswordResetForm'
import { authRoutes } from '../config/auth-routes'
import { passwordRecoverySchema, passwordResetSchema } from '../schemas/password-recovery-schema'
import type {
  PasswordRecoveryFormValues,
  PasswordResetFormValues,
} from '../types/password-recovery'

type RecoveryStep = 'request' | 'reset' | 'done'

export function PasswordRecoveryScreen() {
  const t = useTranslations('auth.passwordRecovery')
  const [step, setStep] = useState<RecoveryStep>('request')

  const requestForm = useForm<PasswordRecoveryFormValues>({
    resolver: zodResolver(passwordRecoverySchema),
    defaultValues: { email: '' },
  })

  const resetForm = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { code: '', password: '', passwordConfirmation: '' },
  })

  const requestRecovery = requestForm.handleSubmit(() => {
    setStep('reset')
  })

  const submitReset = resetForm.handleSubmit(() => {
    setStep('done')
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
      ) : step === 'reset' ? (
        <PasswordResetForm
          control={resetForm.control}
          isSubmitting={resetForm.formState.isSubmitting}
          onSubmit={submitReset}
          onResend={resendCode}
        />
      ) : (
        <PasswordRecoveryConfirmation />
      )}
    </AuthShell>
  )
}

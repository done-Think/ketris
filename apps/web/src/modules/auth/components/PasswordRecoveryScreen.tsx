'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Link as MuiLink } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

import { Link } from '@/i18n/navigation'
import { componentText } from '@shared/theme/tokens'

import { AuthShell } from './AuthShell'
import { PasswordRecoveryConfirmation } from './PasswordRecoveryConfirmation'
import { PasswordRecoveryForm } from './PasswordRecoveryForm'
import { authRoutes } from '../config/auth-routes'
import { passwordRecoverySchema } from '../schemas/password-recovery-schema'
import type { PasswordRecoveryFormValues } from '../types/password-recovery'

export function PasswordRecoveryScreen() {
  const t = useTranslations('auth.passwordRecovery')
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
      brandDescription={isSubmitSuccessful ? t('successBrandDescription') : t('brandDescription')}
      contentMaxWidth={560}
      mobileVariant="backdrop"
      footer={
        isSubmitSuccessful ? undefined : (
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

'use client'

import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { Link } from '@/i18n/navigation'
import { authPrimaryButtonSx } from '@shared/components/form/auth-form.styles'
import { useSignupVerification } from '../hooks/use-signup-verification'
import { createVerificationCodeSchema } from '../schemas/password-recovery-schema'
import { styles } from '../styles/email-verification-step.styles'
import type { EmailVerificationStepProps } from '../types/registration'
import { ResendCountdownButton } from './ResendCountdownButton'
import { VerificationCodeField } from './VerificationCodeField'

export function EmailVerificationStep(props: EmailVerificationStepProps) {
  const t = useTranslations('auth.registerDetails.emailVerification')
  const { confirm, resend, error, confirmed, isPending } = useSignupVerification(props)
  const schema = useMemo(() => createVerificationCodeSchema((key) => t(`errors.${key}`)), [t])
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { code: '' },
  })
  const code = useWatch({ control, name: 'code' })
  return (
    <Box sx={styles.box}>
      <Box aria-hidden="true" sx={styles.box2}>
        <MarkEmailReadOutlinedIcon sx={styles.markEmailReadOutlinedIcon} />
      </Box>
      <Typography variant="h5" sx={styles.typography}>
        {t('title')}
      </Typography>
      <Typography color="text.secondary" sx={styles.typography2}>
        {t('description', { email: props.verification.email })}
      </Typography>
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(({ code }) => confirm(code))}
        sx={styles.box3}
      >
        <Stack spacing={2}>
          {!props.verification.emailSent && !resend.isSuccess ? (
            <Alert severity="warning">{t('deliveryFailed')}</Alert>
          ) : null}
          {error ? <Alert severity="error">{error}</Alert> : null}
          {resend.isSuccess ? <Alert severity="info">{t('resendRequested')}</Alert> : null}
          {!confirmed ? (
            <>
              <VerificationCodeField
                control={control}
                name="code"
                label={t('code.label')}
                disabled={isPending}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={!/^\d{6}$/.test(code ?? '') || isPending}
                sx={authPrimaryButtonSx}
              >
                {t('submit')}
              </Button>
              <ResendCountdownButton
                disabled={isPending}
                onResend={() => {
                  void resend.mutateAsync().catch(() => undefined)
                }}
              />
            </>
          ) : null}
          <Button component={Link} href="/login" disabled={isPending}>
            {t('backToLogin')}
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}

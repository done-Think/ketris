'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

import { Link } from '@/i18n/navigation'
import { getApiErrorCode } from '@shared/utils/error-message'

import { usePublicEmailChange } from '../hooks/use-public-email-change'
import { createVerificationCodeSchema } from '../schemas/password-recovery-schema'
import { styles } from '../styles/public-email-change-screen.styles'
import type {
  PublicEmailChangeScreenProps,
  PublicEmailChangeValues,
} from '../types/public-email-change'
import { AuthShell } from '@shared/components/layout/AuthShell'
import { VerificationCodeField } from './VerificationCodeField'

export function PublicEmailChangeScreen({ requestId }: PublicEmailChangeScreenProps) {
  const t = useTranslations('common.profilePage.emailChange.public')
  const confirm = usePublicEmailChange()
  const form = useForm<PublicEmailChangeValues>({
    resolver: zodResolver(createVerificationCodeSchema(() => t('codeInvalid'))),
    defaultValues: { code: '' },
  })

  const submit = form.handleSubmit(async ({ code }) => {
    if (!requestId) return
    form.clearErrors('root')
    try {
      await confirm.mutateAsync({ requestId, code })
      form.reset({ code: '' })
    } catch (error) {
      const errorCode = getApiErrorCode(error)
      form.setError('root', {
        message: t(
          errorCode === 'INVALID_EMAIL_VERIFICATION_CODE'
            ? 'codeInvalid'
            : errorCode === 'EMAIL_ALREADY_IN_USE'
              ? 'emailInUse'
              : 'error',
        ),
      })
    }
  })

  return (
    <AuthShell brandDescription={t('description')} contentMaxWidth={560} mobileVariant="backdrop">
      <Stack spacing={3}>
        <Typography variant="h3" sx={styles.title}>
          {t('title')}
        </Typography>
        {!requestId ? (
          <Alert severity="error">{t('invalidLink')}</Alert>
        ) : confirm.isSuccess ? (
          <Alert severity="success">{t('success')}</Alert>
        ) : (
          <Stack component="form" noValidate spacing={2} sx={styles.form} onSubmit={submit}>
            <Typography color="text.secondary">{t('description')}</Typography>
            <VerificationCodeField
              control={form.control}
              name="code"
              label={t('codeLabel')}
              disabled={confirm.isPending}
            />
            {form.formState.errors.root?.message ? (
              <Alert severity="error">{form.formState.errors.root.message}</Alert>
            ) : null}
            <Button type="submit" variant="contained" disabled={confirm.isPending}>
              {t('confirm')}
            </Button>
          </Stack>
        )}
        <Button component={Link} href="/login">
          {t('login')}
        </Button>
      </Stack>
    </AuthShell>
  )
}

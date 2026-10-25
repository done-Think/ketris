'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Dialog, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { signOut } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

import { useRouter } from '@/i18n/navigation'
import type { AppLocale } from '@/i18n/types/locale.types'
import { RhfTextField } from '@shared/components/form'
import { getApiErrorCode } from '@shared/utils/error-message'

import { useConfirmEmailChange, useRequestEmailChange } from '../hooks/use-email-change'
import {
  createPasswordRecoverySchema,
  createVerificationCodeSchema,
} from '../schemas/password-recovery-schema'
import type {
  EmailChangeCodeValues,
  EmailChangeDialogProps,
  EmailChangeValues,
} from '../types/current-user-profile'
import { ResendCountdownButton } from './ResendCountdownButton'
import { VerificationCodeField } from './VerificationCodeField'

export function EmailChangeDialog({ onClose }: EmailChangeDialogProps) {
  const t = useTranslations('common.profilePage')
  const locale = useLocale() as AppLocale
  const router = useRouter()
  const queryClient = useQueryClient()
  const request = useRequestEmailChange()
  const confirm = useConfirmEmailChange()
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const emailForm = useForm<EmailChangeValues>({
    resolver: zodResolver(createPasswordRecoverySchema((key) => t(`errors.${key}`))),
    defaultValues: { email: '' },
  })
  const codeForm = useForm<EmailChangeCodeValues>({
    resolver: zodResolver(createVerificationCodeSchema((key) => t(`errors.${key}`))),
    defaultValues: { code: '' },
  })

  function errorMessage(error: unknown) {
    const code = getApiErrorCode(error)
    return t(
      code === 'INVALID_EMAIL_VERIFICATION_CODE'
        ? 'errors.codeInvalid'
        : code === 'RATE_LIMIT_EXCEEDED'
          ? 'emailChangeRateLimit'
          : code === 'EMAIL_ALREADY_IN_USE'
            ? 'emailAlreadyInUse'
            : 'emailChangeError',
    )
  }

  async function sendCode({ email }: EmailChangeValues) {
    emailForm.clearErrors('root')
    try {
      await request.mutateAsync({ email, locale })
      setPendingEmail(email)
    } catch (error) {
      emailForm.setError('root', { message: errorMessage(error) })
    }
  }

  async function verifyCode({ code }: EmailChangeCodeValues) {
    if (!pendingEmail) return
    codeForm.clearErrors('root')
    try {
      await confirm.mutateAsync({ email: pendingEmail, code })
    } catch (error) {
      codeForm.setError('root', { message: errorMessage(error) })
      return
    }
    queryClient.clear()
    await signOut({ redirect: false })
    router.replace('/login')
  }

  async function resend() {
    if (!pendingEmail) return
    codeForm.clearErrors('root')
    try {
      await request.mutateAsync({ email: pendingEmail, locale })
    } catch (error) {
      codeForm.setError('root', { message: errorMessage(error) })
    }
  }

  const busy = request.isPending || confirm.isPending || codeForm.formState.isSubmitting
  return (
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('changeEmail')}</DialogTitle>
      <DialogContent>
        {pendingEmail ? (
          <Stack
            component="form"
            noValidate
            spacing={2}
            onSubmit={codeForm.handleSubmit(verifyCode)}
          >
            <Typography>{t('emailChangeSent', { email: pendingEmail })}</Typography>
            <Typography>{t('emailChangeExplanation')}</Typography>
            <VerificationCodeField
              control={codeForm.control}
              name="code"
              label={t('emailChangeCode')}
              disabled={busy}
            />
            {codeForm.formState.errors.root?.message ? (
              <Alert severity="error">{codeForm.formState.errors.root.message}</Alert>
            ) : null}
            <ResendCountdownButton onResend={resend} disabled={busy} />
            <Button type="submit" variant="contained" disabled={busy}>
              {t('emailChangeConfirm')}
            </Button>
            <Button type="button" onClick={onClose} disabled={busy}>
              {t('cancel')}
            </Button>
          </Stack>
        ) : (
          <Stack
            component="form"
            noValidate
            spacing={2}
            onSubmit={emailForm.handleSubmit(sendCode)}
          >
            <Typography>{t('emailChangeExplanation')}</Typography>
            <RhfTextField
              control={emailForm.control}
              name="email"
              label={t('newEmail')}
              type="email"
              autoComplete="email"
              fullWidth
              disabled={busy}
            />
            {emailForm.formState.errors.root?.message ? (
              <Alert severity="error">{emailForm.formState.errors.root.message}</Alert>
            ) : null}
            <Button type="submit" variant="contained" disabled={busy}>
              {t('emailChangeSend')}
            </Button>
            <Button type="button" onClick={onClose} disabled={busy}>
              {t('cancel')}
            </Button>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  )
}

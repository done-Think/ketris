'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'

import { Link } from '@/i18n/navigation'
import { AuthShell } from '@shared/components/layout/AuthShell'
import { RhfPasswordField } from '@shared/components/form'

import { useAcceptTeamInvitation, useTeamInvitation } from '../hooks/use-team'
import { createAcceptInvitationSchema } from '../schemas/broker-team-action-schemas'
import { styles } from '../styles/accept-invitation-screen.styles'
import type { AcceptInvitationFormValues, AcceptInvitationScreenProps } from '../types/broker-team'

export function AcceptInvitationScreen({ token }: AcceptInvitationScreenProps) {
  const t = useTranslations('dashboard.team.invitationPage')
  const preview = useTeamInvitation(token)
  const accept = useAcceptTeamInvitation()
  const schema = useMemo(() => createAcceptInvitationSchema((key) => t(key)), [t])
  const form = useForm<AcceptInvitationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', passwordConfirmation: '' },
  })
  const invitation = preview.data
  const unavailableMessage =
    !token || preview.isError
      ? t('invalid')
      : invitation?.status === 'EXPIRED'
        ? t('expired')
        : invitation?.status === 'ACCEPTED'
          ? t('accepted')
          : null

  const submit = form.handleSubmit(async ({ password }) => {
    if (!token) return
    form.clearErrors('root')
    try {
      await accept.mutateAsync({ token, password })
    } catch {
      form.setError('root', { message: t('error') })
    }
  })

  return (
    <AuthShell
      brandDescription={t('brandDescription')}
      contentMaxWidth={560}
      mobileVariant="backdrop"
    >
      <Stack spacing={3}>
        <Typography variant="h3" sx={styles.title}>
          {t('title')}
        </Typography>
        {token && preview.isPending ? (
          <CircularProgress sx={styles.loading} aria-label={t('title')} />
        ) : unavailableMessage ? (
          <Alert severity={invitation?.status === 'ACCEPTED' ? 'info' : 'error'}>
            {unavailableMessage}
          </Alert>
        ) : accept.isSuccess ? (
          <Alert severity="success">{t('success')}</Alert>
        ) : invitation ? (
          <Stack component="form" noValidate spacing={2} sx={styles.form} onSubmit={submit}>
            <Typography color="text.secondary">
              {t('description', { agency: invitation.agencyName })}
            </Typography>
            <TextField label={t('name')} value={invitation.name} disabled fullWidth />
            <TextField label={t('email')} value={invitation.email} disabled fullWidth />
            <RhfPasswordField
              control={form.control}
              name="password"
              label={t('password')}
              autoComplete="new-password"
              fullWidth
              disabled={accept.isPending}
            />
            <RhfPasswordField
              control={form.control}
              name="passwordConfirmation"
              label={t('passwordConfirmation')}
              autoComplete="new-password"
              fullWidth
              disabled={accept.isPending}
            />
            {form.formState.errors.root?.message ? (
              <Alert severity="error">{form.formState.errors.root.message}</Alert>
            ) : null}
            <Button type="submit" variant="contained" disabled={accept.isPending}>
              {t('submit')}
            </Button>
          </Stack>
        ) : null}
        <Button component={Link} href="/login">
          {t('login')}
        </Button>
      </Stack>
    </AuthShell>
  )
}

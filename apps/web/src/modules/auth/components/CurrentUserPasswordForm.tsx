'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useForm } from 'react-hook-form'

import { RhfPasswordField } from '@shared/components/form'
import { getApiErrorCode } from '@shared/utils/error-message'

import { useChangeOwnPassword } from '../hooks/use-current-user'
import { createChangeOwnPasswordSchema } from '../schemas/current-user-profile-schema'
import { styles } from '../styles/current-user-profile-page.styles'
import type { ChangeOwnPasswordValues } from '../types/current-user-profile'

export function CurrentUserPasswordForm() {
  const t = useTranslations('common.profilePage')
  const { enqueueSnackbar } = useSnackbar()
  const mutation = useChangeOwnPassword()
  const form = useForm<ChangeOwnPasswordValues>({
    resolver: zodResolver(createChangeOwnPasswordSchema((key) => t(`errors.${key}`))),
    defaultValues: { currentPassword: '', password: '', passwordConfirmation: '' },
  })
  async function changePassword(values: ChangeOwnPasswordValues) {
    form.clearErrors('root')
    try {
      await mutation.mutateAsync(values)
      form.reset({ currentPassword: '', password: '', passwordConfirmation: '' })
      enqueueSnackbar(t('passwordSuccess'), { variant: 'success' })
    } catch (error) {
      if (getApiErrorCode(error) === 'INVALID_CURRENT_PASSWORD') {
        form.setError('currentPassword', { message: t('errors.currentPasswordIncorrect') })
        return
      }
      form.setError('root', { message: t('passwordError') })
    }
  }
  const busy = form.formState.isSubmitting
  return (
    <Paper variant="outlined" sx={styles.panel}>
      <Stack component="form" noValidate spacing={2.5} onSubmit={form.handleSubmit(changePassword)}>
        <Box>
          <Typography variant="h6" sx={styles.typography4}>
            {t('security')}
          </Typography>
          <Typography sx={styles.typography5}>{t('securityDescription')}</Typography>
        </Box>
        <RhfPasswordField
          control={form.control}
          name="currentPassword"
          label={t('currentPassword')}
          autoComplete="current-password"
          fullWidth
          disabled={busy}
        />
        <RhfPasswordField
          control={form.control}
          name="password"
          label={t('newPassword')}
          autoComplete="new-password"
          fullWidth
          disabled={busy}
        />
        <RhfPasswordField
          control={form.control}
          name="passwordConfirmation"
          label={t('confirmPassword')}
          autoComplete="new-password"
          fullWidth
          disabled={busy}
        />
        {form.formState.errors.root?.message ? (
          <Alert severity="error">{form.formState.errors.root.message}</Alert>
        ) : null}
        <Stack direction="row" justifyContent="flex-end">
          <Button type="submit" variant="contained" disabled={busy}>
            {busy ? <CircularProgress size={18} color="inherit" /> : t('changePassword')}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}

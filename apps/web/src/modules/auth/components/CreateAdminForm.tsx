'use client'

import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Stack, Typography } from '@mui/material'
import { useSnackbar } from 'notistack'
import { useTranslations } from 'next-intl'

import { RhfTextField } from '@shared/components/form'
import { ActionTextLink } from '@shared/components/ui'
import { extractErrorMessage } from '@shared/utils/error-message'

import { createAdminSchema, type CreateAdminFormValues } from '../schemas/create-admin-schema'
import { useCreateAdmin } from '../hooks/use-create-admin'

export function CreateAdminForm() {
  const t = useTranslations('auth.backoffice')
  const { enqueueSnackbar } = useSnackbar()
  const createAdmin = useCreateAdmin()
  const adminSchema = useMemo(() => createAdminSchema((key) => t(`errors.${key}`)), [t])

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CreateAdminFormValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  async function onSubmit(values: CreateAdminFormValues) {
    try {
      const admin = await createAdmin.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
      })
      enqueueSnackbar(t('createSuccess', { email: admin.email }), { variant: 'success' })
      reset()
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error, t('createGenericError')), { variant: 'error' })
    }
  }

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2.5}>
      <RhfTextField control={control} name="name" label={t('fields.name')} fullWidth autoFocus />
      <RhfTextField
        control={control}
        name="email"
        label={t('fields.email')}
        type="email"
        autoComplete="username"
        fullWidth
      />
      <RhfTextField
        control={control}
        name="password"
        label={t('fields.password')}
        type="password"
        autoComplete="new-password"
        fullWidth
      />
      <RhfTextField
        control={control}
        name="confirmPassword"
        label={t('fields.passwordConfirmation')}
        type="password"
        autoComplete="new-password"
        fullWidth
      />

      {createAdmin.isError ? (
        <Alert severity="error">
          {extractErrorMessage(createAdmin.error, t('createGenericError'))}
        </Alert>
      ) : null}

      <Button type="submit" variant="contained" size="large" disabled={isSubmitting} fullWidth>
        {t('createSubmit')}
      </Button>

      <Stack direction="row" justifyContent="center">
        <Typography variant="body2" color="text.secondary">
          <ActionTextLink href="/backoffice/admins">{t('backToAdmins')}</ActionTextLink>
        </Typography>
      </Stack>
    </Stack>
  )
}

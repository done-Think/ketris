'use client'

import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, DialogActions, MenuItem, Stack, TextField } from '@mui/material'
import { useSnackbar } from 'notistack'
import { useTranslations } from 'next-intl'

import { RhfTextField } from '@shared/components/form'
import { extractErrorMessage } from '@shared/utils/error-message'

import {
  createPlatformAdminSchema,
  type CreatePlatformAdminFormValues,
} from '../schemas/create-platform-admin-schema'
import { useCreatePlatformAdmin } from '../hooks/use-create-platform-admin'

type CreatePlatformAdminFormProps = {
  onCancel?: () => void
  onSuccess?: () => void
}

export function CreatePlatformAdminForm({ onCancel, onSuccess }: CreatePlatformAdminFormProps) {
  const t = useTranslations('platform.forms')
  const { enqueueSnackbar } = useSnackbar()
  const createPlatformAdmin = useCreatePlatformAdmin()
  const schema = useMemo(() => createPlatformAdminSchema((key) => t(`errors.${key}`)), [t])

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CreatePlatformAdminFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', email: '', password: '', confirmarSenha: '', role: 'ADMIN' },
  })

  async function onSubmit(values: CreatePlatformAdminFormValues) {
    try {
      const admin = await createPlatformAdmin.mutateAsync({
        nome: values.nome,
        email: values.email,
        password: values.password,
        role: values.role,
      })
      enqueueSnackbar(t('createPlatformAdminSuccess', { email: admin.email }), {
        variant: 'success',
      })
      reset()
      onSuccess?.()
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error, t('createPlatformAdminError')), {
        variant: 'error',
      })
    }
  }

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2.5} sx={{ maxWidth: 420 }}>
      <RhfTextField control={control} name="nome" label={t('name')} fullWidth autoFocus />
      <RhfTextField
        control={control}
        name="email"
        label={t('email')}
        type="email"
        autoComplete="username"
        fullWidth
      />
      <Controller
        control={control}
        name="role"
        render={({ field }) => (
          <TextField
            select
            label={t('role')}
            value={field.value}
            onChange={field.onChange}
            inputRef={field.ref}
            fullWidth
          >
            <MenuItem value="ADMIN">Admin</MenuItem>
            <MenuItem value="ADMIN_AGENT">Admin + Agent</MenuItem>
            <MenuItem value="AGENT">Agent</MenuItem>
          </TextField>
        )}
      />
      <RhfTextField
        control={control}
        name="password"
        label={t('password')}
        type="password"
        autoComplete="new-password"
        fullWidth
      />
      <RhfTextField
        control={control}
        name="confirmarSenha"
        label={t('passwordConfirmation')}
        type="password"
        autoComplete="new-password"
        fullWidth
      />

      {createPlatformAdmin.isError ? (
        <Alert severity="error">
          {extractErrorMessage(createPlatformAdmin.error, t('createPlatformAdminError'))}
        </Alert>
      ) : null}

      {onCancel ? (
        <DialogActions sx={{ px: 0, pb: 0, pt: 0 }}>
          <Button
            type="button"
            variant="outlined"
            color="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t('cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {t('createPlatformAdminSubmit')}
          </Button>
        </DialogActions>
      ) : (
        <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
          {t('createPlatformAdminSubmit')}
        </Button>
      )}
    </Stack>
  )
}

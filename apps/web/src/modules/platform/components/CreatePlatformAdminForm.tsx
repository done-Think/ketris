'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Stack } from '@mui/material'
import { useSnackbar } from 'notistack'
import axios from 'axios'
import { useTranslations } from 'next-intl'

import { RhfTextField } from '@shared/components/form'

import {
  createPlatformAdminSchema,
  type CreatePlatformAdminFormValues,
} from '../schemas/create-platform-admin-schema'
import { useCreatePlatformAdmin } from '../hooks/use-create-platform-admin'

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message
    if (typeof message === 'string') return message
  }
  return fallback
}

export function CreatePlatformAdminForm() {
  const t = useTranslations('platform.forms')
  const { enqueueSnackbar } = useSnackbar()
  const createPlatformAdmin = useCreatePlatformAdmin()

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CreatePlatformAdminFormValues>({
    resolver: zodResolver(createPlatformAdminSchema),
    defaultValues: { nome: '', email: '', password: '', confirmarSenha: '' },
  })

  async function onSubmit(values: CreatePlatformAdminFormValues) {
    try {
      const admin = await createPlatformAdmin.mutateAsync({
        nome: values.nome,
        email: values.email,
        password: values.password,
      })
      enqueueSnackbar(t('createPlatformAdminSuccess', { email: admin.email }), {
        variant: 'success',
      })
      reset()
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

      <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
        {t('createPlatformAdminSubmit')}
      </Button>
    </Stack>
  )
}

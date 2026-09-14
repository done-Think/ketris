'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Stack } from '@mui/material'
import { useSnackbar } from 'notistack'
import axios from 'axios'
import { useTranslations } from 'next-intl'

import { RhfTextField } from '@shared/components/form'

import {
  createTenantAdminSchema,
  type CreateTenantAdminFormValues,
} from '../schemas/create-tenant-admin-schema'
import { useCreateTenantAdmin } from '../hooks/use-create-tenant-admin'

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message
    if (typeof message === 'string') return message
  }
  return fallback
}

type CreateTenantAdminFormProps = {
  tenantId: string
}

export function CreateTenantAdminForm({ tenantId }: CreateTenantAdminFormProps) {
  const t = useTranslations('platform.forms')
  const { enqueueSnackbar } = useSnackbar()
  const createTenantAdmin = useCreateTenantAdmin()

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CreateTenantAdminFormValues>({
    resolver: zodResolver(createTenantAdminSchema),
    defaultValues: { nome: '', email: '', password: '', confirmarSenha: '' },
  })

  async function onSubmit(values: CreateTenantAdminFormValues) {
    try {
      const user = await createTenantAdmin.mutateAsync({ tenantId, ...values })
      enqueueSnackbar(t('createTenantAdminSuccess', { email: user.email }), { variant: 'success' })
      reset()
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error, t('createTenantAdminError')), { variant: 'error' })
    }
  }

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2.5} sx={{ maxWidth: 420 }}>
      <RhfTextField control={control} name="nome" label={t('name')} fullWidth />
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

      {createTenantAdmin.isError ? (
        <Alert severity="error">
          {extractErrorMessage(createTenantAdmin.error, t('createTenantAdminError'))}
        </Alert>
      ) : null}

      <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
        {t('createTenantAdminSubmit')}
      </Button>
    </Stack>
  )
}

'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, CircularProgress, Stack } from '@mui/material'
import { useSnackbar } from 'notistack'
import axios from 'axios'
import { useTranslations } from 'next-intl'

import { RhfTextField } from '@shared/components/form'

import { updateAdminSchema, type UpdateAdminFormValues } from '../schemas/update-admin-schema'
import { useAdmin } from '../hooks/use-admin'
import { useUpdateAdmin } from '../hooks/use-update-admin'

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message
    if (typeof message === 'string') return message
  }
  return fallback
}

type EditAdminFormProps = {
  adminId: string
}

export function EditAdminForm({ adminId }: EditAdminFormProps) {
  const t = useTranslations('auth.backoffice')
  const { enqueueSnackbar } = useSnackbar()
  const { data: admin, isLoading, isError } = useAdmin(adminId)
  const updateAdmin = useUpdateAdmin()

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<UpdateAdminFormValues>({
    resolver: zodResolver(updateAdminSchema),
    defaultValues: { nome: '', email: '' },
  })

  useEffect(() => {
    if (admin) {
      reset({ nome: admin.nome, email: admin.email })
    }
  }, [admin, reset])

  async function onSubmit(values: UpdateAdminFormValues) {
    try {
      await updateAdmin.mutateAsync({ id: adminId, ...values })
      enqueueSnackbar(t('editSuccess'), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error, t('editGenericError')), { variant: 'error' })
    }
  }

  if (isLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 6 }}>
        <CircularProgress size={28} />
      </Stack>
    )
  }

  if (isError || !admin) {
    return <Alert severity="error">{t('editLoadError')}</Alert>
  }

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2.5} sx={{ maxWidth: 420 }}>
      <RhfTextField control={control} name="nome" label={t('fields.name')} fullWidth />
      <RhfTextField
        control={control}
        name="email"
        label={t('fields.email')}
        type="email"
        fullWidth
      />

      {updateAdmin.isError ? (
        <Alert severity="error">
          {extractErrorMessage(updateAdmin.error, t('editGenericError'))}
        </Alert>
      ) : null}

      <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
        {t('editSubmit')}
      </Button>
    </Stack>
  )
}

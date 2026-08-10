'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, CircularProgress, Stack } from '@mui/material'
import { useSnackbar } from 'notistack'
import axios from 'axios'

import { RhfTextField } from '@shared/components/form'

import { updateAdminSchema, type UpdateAdminFormValues } from '../schemas/update-admin-schema'
import { useAdmin } from '../hooks/use-admin'
import { useUpdateAdmin } from '../hooks/use-update-admin'

const GENERIC_ERROR = 'Não foi possível salvar as alterações. Tente novamente.'

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message
    if (typeof message === 'string') return message
  }
  return GENERIC_ERROR
}

type EditAdminFormProps = {
  adminId: string
}

export function EditAdminForm({ adminId }: EditAdminFormProps) {
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
      enqueueSnackbar('Administrador atualizado.', { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error), { variant: 'error' })
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
    return <Alert severity="error">Não foi possível carregar este administrador.</Alert>
  }

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2.5} sx={{ maxWidth: 420 }}>
      <RhfTextField control={control} name="nome" label="Nome" fullWidth />
      <RhfTextField control={control} name="email" label="E-mail" type="email" fullWidth />

      {updateAdmin.isError ? (
        <Alert severity="error">{extractErrorMessage(updateAdmin.error)}</Alert>
      ) : null}

      <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
        Salvar alterações
      </Button>
    </Stack>
  )
}

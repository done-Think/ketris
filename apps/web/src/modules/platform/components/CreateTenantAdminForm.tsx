'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Stack } from '@mui/material'
import { useSnackbar } from 'notistack'
import axios from 'axios'

import { RhfTextField } from '@shared/components/form'

import {
  createTenantAdminSchema,
  type CreateTenantAdminFormValues,
} from '../schemas/create-tenant-admin-schema'
import { useCreateTenantAdmin } from '../hooks/use-create-tenant-admin'

const GENERIC_ERROR = 'Não foi possível criar o administrador da imobiliária. Tente novamente.'

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message
    if (typeof message === 'string') return message
  }
  return GENERIC_ERROR
}

type CreateTenantAdminFormProps = {
  tenantId: string
}

export function CreateTenantAdminForm({ tenantId }: CreateTenantAdminFormProps) {
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
      enqueueSnackbar(`Administrador ${user.email} criado com sucesso.`, { variant: 'success' })
      reset()
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error), { variant: 'error' })
    }
  }

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2.5} sx={{ maxWidth: 420 }}>
      <RhfTextField control={control} name="nome" label="Nome" fullWidth />
      <RhfTextField
        control={control}
        name="email"
        label="E-mail"
        type="email"
        autoComplete="username"
        fullWidth
      />
      <RhfTextField
        control={control}
        name="password"
        label="Senha"
        type="password"
        autoComplete="new-password"
        fullWidth
      />
      <RhfTextField
        control={control}
        name="confirmarSenha"
        label="Confirmar senha"
        type="password"
        autoComplete="new-password"
        fullWidth
      />

      {createTenantAdmin.isError ? (
        <Alert severity="error">{extractErrorMessage(createTenantAdmin.error)}</Alert>
      ) : null}

      <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
        Criar administrador da imobiliária
      </Button>
    </Stack>
  )
}

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Stack, Typography } from '@mui/material'
import { useSnackbar } from 'notistack'
import axios from 'axios'

import { RhfTextField } from '@shared/components/form'
import { ActionTextLink } from '@shared/components/ui'

import { createAdminSchema, type CreateAdminFormValues } from '../schemas/create-admin-schema'
import { useCreateAdmin } from '../hooks/use-create-admin'

const GENERIC_ERROR = 'Não foi possível criar o administrador. Tente novamente.'

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message
    if (typeof message === 'string') return message
  }
  return GENERIC_ERROR
}

export function CreateAdminForm() {
  const { enqueueSnackbar } = useSnackbar()
  const createAdmin = useCreateAdmin()

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CreateAdminFormValues>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: { nome: '', email: '', password: '', confirmarSenha: '' },
  })

  async function onSubmit(values: CreateAdminFormValues) {
    try {
      const admin = await createAdmin.mutateAsync({
        nome: values.nome,
        email: values.email,
        password: values.password,
      })
      enqueueSnackbar(`Administrador ${admin.email} criado com sucesso.`, { variant: 'success' })
      reset()
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error), { variant: 'error' })
    }
  }

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2.5}>
      <RhfTextField control={control} name="nome" label="Nome" fullWidth autoFocus />
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

      {createAdmin.isError ? (
        <Alert severity="error">{extractErrorMessage(createAdmin.error)}</Alert>
      ) : null}

      <Button type="submit" variant="contained" size="large" disabled={isSubmitting} fullWidth>
        Criar administrador
      </Button>

      <Stack direction="row" justifyContent="center">
        <Typography variant="body2" color="text.secondary">
          <ActionTextLink href="/backoffice/admins">Voltar para administradores</ActionTextLink>
        </Typography>
      </Stack>
    </Stack>
  )
}

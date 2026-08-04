'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Stack } from '@mui/material'
import { useSnackbar } from 'notistack'
import axios from 'axios'

import { RhfTextField } from '@shared/components/form'

import {
  createPlatformAdminSchema,
  type CreatePlatformAdminFormValues,
} from '../schemas/create-platform-admin-schema'
import { useCreatePlatformAdmin } from '../hooks/use-create-platform-admin'

const GENERIC_ERROR = 'Não foi possível criar o administrador da plataforma. Tente novamente.'

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message
    if (typeof message === 'string') return message
  }
  return GENERIC_ERROR
}

export function CreatePlatformAdminForm() {
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
      enqueueSnackbar(`Administrador da plataforma ${admin.email} criado com sucesso.`, {
        variant: 'success',
      })
      reset()
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error), { variant: 'error' })
    }
  }

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2.5} sx={{ maxWidth: 420 }}>
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

      {createPlatformAdmin.isError ? (
        <Alert severity="error">{extractErrorMessage(createPlatformAdmin.error)}</Alert>
      ) : null}

      <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
        Criar administrador da plataforma
      </Button>
    </Stack>
  )
}

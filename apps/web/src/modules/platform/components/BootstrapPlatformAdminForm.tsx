'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Stack, Typography } from '@mui/material'
import { useSnackbar } from 'notistack'
import axios from 'axios'
import { useRouter } from 'next/navigation'

import { RhfTextField } from '@shared/components/form'

import {
  bootstrapPlatformAdminSchema,
  type BootstrapPlatformAdminFormValues,
} from '../schemas/bootstrap-platform-admin-schema'
import { useBootstrapPlatformAdmin } from '../hooks/use-bootstrap-platform-admin'

const GENERIC_ERROR = 'Não foi possível criar o acesso da plataforma. Tente novamente.'

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message
    if (typeof message === 'string') return message
  }
  return GENERIC_ERROR
}

export function BootstrapPlatformAdminForm() {
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const bootstrapPlatformAdmin = useBootstrapPlatformAdmin()

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<BootstrapPlatformAdminFormValues>({
    resolver: zodResolver(bootstrapPlatformAdminSchema),
    defaultValues: { nome: '', email: '', password: '', confirmarSenha: '' },
  })

  async function onSubmit(values: BootstrapPlatformAdminFormValues) {
    try {
      await bootstrapPlatformAdmin.mutateAsync({
        nome: values.nome,
        email: values.email,
        password: values.password,
      })
      enqueueSnackbar('Acesso da plataforma criado. Entre com suas credenciais.', {
        variant: 'success',
      })
      router.push('/platform/login')
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

      {bootstrapPlatformAdmin.isError ? (
        <Alert severity="error">{extractErrorMessage(bootstrapPlatformAdmin.error)}</Alert>
      ) : null}

      <Button type="submit" variant="contained" size="large" disabled={isSubmitting} fullWidth>
        Criar acesso da plataforma
      </Button>

      <Typography variant="body2" color="text.secondary" textAlign="center">
        Disponível apenas enquanto nenhum administrador da plataforma existir.
      </Typography>
    </Stack>
  )
}

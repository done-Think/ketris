'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Stack, Typography } from '@mui/material'
import { useSnackbar } from 'notistack'
import axios from 'axios'
import { useRouter } from 'next/navigation'

import { RhfTextField } from '@shared/components/form'
import { ActionTextLink } from '@shared/components/ui'

import {
  bootstrapAdminSchema,
  type BootstrapAdminFormValues,
} from '../schemas/bootstrap-admin-schema'
import { useBootstrapAdmin } from '../hooks/use-bootstrap-admin'

const GENERIC_ERROR = 'Não foi possível criar o administrador. Tente novamente.'

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message
    if (typeof message === 'string') return message
  }
  return GENERIC_ERROR
}

export function BootstrapAdminForm() {
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const bootstrapAdmin = useBootstrapAdmin()

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<BootstrapAdminFormValues>({
    resolver: zodResolver(bootstrapAdminSchema),
    defaultValues: { tenantSlug: '', nome: '', email: '', password: '', confirmarSenha: '' },
  })

  async function onSubmit(values: BootstrapAdminFormValues) {
    try {
      const admin = await bootstrapAdmin.mutateAsync({
        tenantSlug: values.tenantSlug,
        nome: values.nome,
        email: values.email,
        password: values.password,
      })
      enqueueSnackbar(
        `Administrador ${admin.email} criado com sucesso. Faça login para continuar.`,
        {
          variant: 'success',
        },
      )
      router.push('/backoffice/login')
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error), { variant: 'error' })
    }
  }

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2.5}>
      <RhfTextField
        control={control}
        name="tenantSlug"
        label="Tenant"
        helperText="Identificador (slug) do tenant que ainda não tem nenhum administrador."
        fullWidth
        autoFocus
      />
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

      {bootstrapAdmin.isError ? (
        <Alert severity="error">{extractErrorMessage(bootstrapAdmin.error)}</Alert>
      ) : null}

      <Button type="submit" variant="contained" size="large" disabled={isSubmitting} fullWidth>
        Configurar primeiro administrador
      </Button>

      <Stack direction="row" justifyContent="center">
        <Typography variant="body2" color="text.secondary">
          <ActionTextLink href="/backoffice/login">Voltar para o login</ActionTextLink>
        </Typography>
      </Stack>
    </Stack>
  )
}

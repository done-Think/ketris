'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Card, Stack } from '@mui/material'
import { useSnackbar } from 'notistack'
import axios from 'axios'
import { useRouter } from 'next/navigation'

import { RhfTextField } from '@shared/components/form'
import { radius, shadows } from '@shared/theme/tokens'

import { createTenantSchema, type CreateTenantFormValues } from '../schemas/create-tenant-schema'
import { useCreateTenant } from '../hooks/use-create-tenant'

const GENERIC_ERROR = 'Não foi possível criar a imobiliária. Tente novamente.'

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message
    if (typeof message === 'string') return message
  }
  return GENERIC_ERROR
}

export function CreateTenantForm() {
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const createTenant = useCreateTenant()

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<CreateTenantFormValues>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: { nome: '', slug: '' },
  })

  async function onSubmit(values: CreateTenantFormValues) {
    try {
      const tenant = await createTenant.mutateAsync(values)
      enqueueSnackbar(`Imobiliária ${tenant.nome} criada com sucesso.`, { variant: 'success' })
      router.push(`/platform/tenants/${tenant.id}`)
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error), { variant: 'error' })
    }
  }

  return (
    <Card sx={{ borderRadius: `${radius.lg}px`, boxShadow: shadows.popover, p: 4, maxWidth: 480 }}>
      <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2.5}>
        <RhfTextField control={control} name="nome" label="Nome" fullWidth autoFocus />
        <RhfTextField
          control={control}
          name="slug"
          label="Slug"
          helperText="Identificador único, ex.: imobiliaria-exemplo"
          fullWidth
        />

        {createTenant.isError ? (
          <Alert severity="error">{extractErrorMessage(createTenant.error)}</Alert>
        ) : null}

        <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
          Criar imobiliária
        </Button>
      </Stack>
    </Card>
  )
}

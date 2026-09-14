'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Card, Stack } from '@mui/material'
import { useSnackbar } from 'notistack'
import axios from 'axios'
import { useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'
import { RhfTextField } from '@shared/components/form'
import { radius, shadows } from '@shared/theme/tokens'

import { createTenantSchema, type CreateTenantFormValues } from '../schemas/create-tenant-schema'
import { useCreateTenant } from '../hooks/use-create-tenant'

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message
    if (typeof message === 'string') return message
  }
  return fallback
}

export function CreateTenantForm() {
  const t = useTranslations('platform.forms')
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
      enqueueSnackbar(t('createTenantSuccess', { name: tenant.nome }), { variant: 'success' })
      router.push({ pathname: '/platform/tenants/[id]', params: { id: tenant.id } })
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error, t('createTenantError')), { variant: 'error' })
    }
  }

  return (
    <Card sx={{ borderRadius: `${radius.lg}px`, boxShadow: shadows.popover, p: 4, maxWidth: 480 }}>
      <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2.5}>
        <RhfTextField control={control} name="nome" label={t('name')} fullWidth autoFocus />
        <RhfTextField
          control={control}
          name="slug"
          label={t('slug')}
          helperText={t('slugHelper')}
          fullWidth
        />

        {createTenant.isError ? (
          <Alert severity="error">
            {extractErrorMessage(createTenant.error, t('createTenantError'))}
          </Alert>
        ) : null}

        <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
          {t('createTenantSubmit')}
        </Button>
      </Stack>
    </Card>
  )
}

'use client'

import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, CircularProgress, IconButton, InputAdornment, Stack } from '@mui/material'
import { useSnackbar } from 'notistack'
import { useTranslations } from 'next-intl'

import { RhfTextField } from '@shared/components/form'
import { iconSize } from '@shared/theme/tokens'
import { extractErrorMessage } from '@shared/utils/error-message'

import { createTenantAdminSchema } from '../schemas/create-tenant-admin-schema'
import { useCreateTenantAdmin } from '../hooks/use-create-tenant-admin'
import type { CreateTenantAdminFormProps, CreateTenantAdminFormValues } from '../types/tenant'

export function CreateTenantAdminForm({ tenantId }: CreateTenantAdminFormProps) {
  const t = useTranslations('platform.forms')
  const adminT = useTranslations('platform.tenant.newAdmin')
  const { enqueueSnackbar } = useSnackbar()
  const createTenantAdmin = useCreateTenantAdmin()
  const schema = useMemo(() => createTenantAdminSchema((key) => t(`errors.${key}`)), [t])
  const [showPassword, setShowPassword] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CreateTenantAdminFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  async function onSubmit(values: CreateTenantAdminFormValues) {
    try {
      const user = await createTenantAdmin.mutateAsync({ tenantId, ...values })
      enqueueSnackbar(t('createTenantAdminSuccess', { email: user.email }), { variant: 'success' })
      reset()
      setShowPassword(false)
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error, t('createTenantAdminError')), { variant: 'error' })
    }
  }

  const passwordToggle = (
    <InputAdornment position="end">
      <IconButton
        edge="end"
        aria-label={showPassword ? adminT('hidePassword') : adminT('showPassword')}
        onClick={() => setShowPassword((visible) => !visible)}
      >
        {showPassword ? (
          <VisibilityOffOutlinedIcon sx={{ fontSize: iconSize.lg }} />
        ) : (
          <VisibilityOutlinedIcon sx={{ fontSize: iconSize.lg }} />
        )}
      </IconButton>
    </InputAdornment>
  )

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} noValidate spacing={2}>
      <RhfTextField control={control} name="name" label={t('name')} fullWidth />
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
        type={showPassword ? 'text' : 'password'}
        autoComplete="new-password"
        helperText={adminT('passwordHelper')}
        fullWidth
        slotProps={{ input: { endAdornment: passwordToggle } }}
      />
      <RhfTextField
        control={control}
        name="confirmPassword"
        label={t('passwordConfirmation')}
        type={showPassword ? 'text' : 'password'}
        autoComplete="new-password"
        fullWidth
      />

      {createTenantAdmin.isError ? (
        <Alert severity="error">
          {extractErrorMessage(createTenantAdmin.error, t('createTenantAdminError'))}
        </Alert>
      ) : null}

      <Button
        type="submit"
        variant="contained"
        disabled={isSubmitting}
        startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
      >
        {adminT('submit')}
      </Button>
    </Stack>
  )
}

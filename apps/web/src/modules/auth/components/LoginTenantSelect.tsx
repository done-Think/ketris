'use client'

import { MenuItem, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'

import { authTextFieldSx } from '@shared/components/form/auth-form.styles'

import type { LoginTenantSelectProps } from '../types/login'

export function LoginTenantSelect({ control, tenants }: LoginTenantSelectProps) {
  const t = useTranslations('auth.login.tenant')
  if (tenants.length === 0) return null
  return (
    <Controller
      name="tenantId"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          value={field.value ?? ''}
          select
          fullWidth
          label={t('label')}
          helperText={t('helper')}
          sx={authTextFieldSx}
        >
          <MenuItem value="" disabled>
            {t('placeholder')}
          </MenuItem>
          {tenants.map((tenant) => (
            <MenuItem key={tenant.id} value={tenant.id}>
              {tenant.name}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  )
}

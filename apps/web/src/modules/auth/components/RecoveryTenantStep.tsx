'use client'

import { Alert, Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'

import { authPrimaryButtonSx, authTextFieldSx } from '@shared/components/form/auth-form.styles'
import { componentText } from '@shared/theme/tokens'

import { styles } from '../styles/verification-code-step.styles'
import type { RecoveryTenantStepProps } from '../types/password-recovery'

export function RecoveryTenantStep({
  control,
  tenants,
  isSubmitting,
  onSubmit,
  error,
  onBack,
}: RecoveryTenantStepProps) {
  const t = useTranslations('auth.passwordRecovery.tenant')
  return (
    <Box>
      <Box sx={styles.box3}>
        <Typography variant="h3" sx={componentText.authCompactTitle}>
          {t('title')}
        </Typography>
        <Typography sx={styles.typography}>{t('description')}</Typography>
      </Box>
      <Stack component="form" noValidate spacing={2} sx={styles.stack} onSubmit={onSubmit}>
        <Controller
          control={control}
          name="tenantId"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              select
              fullWidth
              label={t('label')}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
              disabled={isSubmitting}
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
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Button type="submit" variant="contained" disabled={isSubmitting} sx={authPrimaryButtonSx}>
          {t('submit')}
        </Button>
        <Button type="button" onClick={onBack} disabled={isSubmitting}>
          {t('back')}
        </Button>
      </Stack>
    </Box>
  )
}

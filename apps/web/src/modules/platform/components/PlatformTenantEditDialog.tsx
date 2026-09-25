'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'

import { editDemoTenantSchema, type EditDemoTenantValues } from '../schemas/edit-demo-tenant-schema'
import type { PlatformTenantEditDialogProps } from '../types/platform-tenant'

export function PlatformTenantEditDialog({
  tenant,
  onClose,
  onSave,
}: PlatformTenantEditDialogProps) {
  const t = useTranslations('platform.tenants')
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditDemoTenantValues>({
    resolver: zodResolver(editDemoTenantSchema),
    defaultValues: { name: tenant.name, plan: tenant.plan, status: tenant.status },
  })
  const { ref: nameRef, ...nameField } = register('name')

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="edit-tenant-title"
      aria-describedby="edit-tenant-description"
    >
      <DialogTitle id="edit-tenant-title">{t('editTitle')}</DialogTitle>
      <DialogContent>
        <DialogContentText id="edit-tenant-description" sx={{ mb: 2 }}>
          {t('editDescription')}
        </DialogContentText>
        <Stack
          id="edit-tenant-form"
          component="form"
          spacing={2}
          onSubmit={handleSubmit((values) => onSave({ ...tenant, ...values }))}
        >
          <TextField
            autoFocus
            label={t('columns.name')}
            {...nameField}
            inputRef={nameRef}
            error={Boolean(errors.name)}
            helperText={errors.name ? t('nameRequired') : undefined}
          />
          <Controller
            name="plan"
            control={control}
            render={({ field: { ref, ...field } }) => (
              <TextField select label={t('columns.plan')} {...field} inputRef={ref}>
                {(['starter', 'pro', 'enterprise'] as const).map((plan) => (
                  <MenuItem key={plan} value={plan}>
                    {t(`plans.${plan}`)}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <Controller
            name="status"
            control={control}
            render={({ field: { ref, ...field } }) => (
              <TextField select label={t('columns.status')} {...field} inputRef={ref}>
                {(['active', 'trial', 'suspended'] as const).map((status) => (
                  <MenuItem key={status} value={status}>
                    {t(`statuses.${status}`)}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button type="submit" form="edit-tenant-form" variant="contained">
          {t('save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

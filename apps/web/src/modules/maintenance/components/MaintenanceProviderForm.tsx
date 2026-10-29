'use client'

import * as maintenanceStyles from '../styles/maintenance-provider-form.styles'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from '@mui/material'
import { RhfTextField } from '@shared/components/form'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { createMaintenanceProviderSchema } from '../schemas/maintenance-provider-schema'
import type {
  MaintenanceProviderFormProps,
  MaintenanceProviderFormValues,
} from '../types/maintenance-provider'

export function MaintenanceProviderForm({
  provider,
  isPending,
  onClose,
  onSubmit,
}: MaintenanceProviderFormProps) {
  const t = useTranslations('dashboard.maintenance.providers')
  const errors = useTranslations('dashboard.maintenance.workflow.validation')
  const schema = useMemo(() => createMaintenanceProviderSchema((key) => errors(key)), [errors])
  const { control, handleSubmit } = useForm<MaintenanceProviderFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: provider?.name ?? '',
      phone: provider?.phone ?? '',
      email: provider?.email ?? '',
      notes: provider?.notes ?? '',
    },
  })
  return (
    <Dialog open onClose={() => !isPending && onClose()} fullWidth maxWidth="sm">
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{provider ? t('editTitle') : t('createTitle')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={maintenanceStyles.stackSx}>
            <RhfTextField control={control} name="name" label={t('name')} required autoFocus />
            <RhfTextField control={control} name="phone" label={t('phone')} />
            <RhfTextField control={control} name="email" label={t('email')} type="email" />
            <RhfTextField control={control} name="notes" label={t('notes')} multiline minRows={3} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={isPending} onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {t('save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

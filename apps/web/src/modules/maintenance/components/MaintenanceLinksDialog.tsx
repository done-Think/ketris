'use client'

import { useMemo } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { Controller, useForm } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'

import { useLinkMaintenanceUsers, useMaintenanceOptions } from '../hooks/use-maintenance'
import { createMaintenanceLinksSchema } from '../schemas/maintenance-links-schema'
import type { MaintenanceLinksDialogProps, MaintenanceLinksFormValues } from '../types/maintenance'
import { errorMessage } from '../utils/error-message'

const emptyValues: MaintenanceLinksFormValues = {
  contractId: '',
  ownerId: '',
  partyId: '',
  renterId: '',
}

export function MaintenanceLinksDialog({ open, onClose }: MaintenanceLinksDialogProps) {
  const t = useTranslations('dashboard.maintenance.links')
  const { data: options } = useMaintenanceOptions()
  const linkUsers = useLinkMaintenanceUsers()
  const { enqueueSnackbar } = useSnackbar()
  const schema = useMemo(() => createMaintenanceLinksSchema((key) => t(`errors.${key}`)), [t])
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { isValid },
  } = useForm<MaintenanceLinksFormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: emptyValues,
  })
  const [contractId, partyId] = watch(['contractId', 'partyId'])
  const contract = options?.contracts.find((item) => item.id === contractId)

  async function submit(values: MaintenanceLinksFormValues) {
    try {
      await linkUsers.mutateAsync({
        contractId: values.contractId,
        ownerId: values.ownerId || undefined,
        partyId: values.partyId || undefined,
        renterId: values.renterId || undefined,
      })
      enqueueSnackbar(t('success'), { variant: 'success' })
      onClose()
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('error')), { variant: 'error' })
    }
  }

  return (
    <Dialog open={open} onClose={() => !linkUsers.isPending && onClose()} fullWidth maxWidth="sm">
      <form noValidate onSubmit={handleSubmit(submit)}>
        <DialogTitle>{t('title')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {/* Choosing another contract invalidates every choice made for the previous one. */}
            <Controller
              control={control}
              name="contractId"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label={t('contract')}
                  select
                  required
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  onChange={(event) => {
                    field.onChange(event)
                    setValue('ownerId', '')
                    setValue('partyId', '')
                    setValue('renterId', '', { shouldValidate: true })
                  }}
                >
                  {(options?.contracts ?? []).map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.code} - {item.propertyTitle}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <RhfTextField control={control} name="ownerId" label={t('owner')} select>
              <MenuItem value="">{t('unchanged')}</MenuItem>
              {(options?.users ?? [])
                .filter((user) => user.role === 'PROPERTY_OWNER')
                .map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
            </RhfTextField>
            <Controller
              control={control}
              name="partyId"
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('party')}
                  select
                  onChange={(event) => {
                    field.onChange(event)
                    setValue('renterId', '', { shouldValidate: true })
                  }}
                >
                  <MenuItem value="">{t('unchanged')}</MenuItem>
                  {(contract?.parties ?? [])
                    .filter((party) => party.role === 'LOCATARIO')
                    .map((party) => (
                      <MenuItem key={party.id} value={party.id}>
                        {party.name}
                      </MenuItem>
                    ))}
                </TextField>
              )}
            />
            {partyId && (
              <RhfTextField control={control} name="renterId" label={t('renter')} select required>
                {(options?.users ?? [])
                  .filter((user) => user.role === 'RENTER')
                  .map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))}
              </RhfTextField>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={linkUsers.isPending} onClick={onClose}>
            {t('back')}
          </Button>
          <Button type="submit" variant="contained" disabled={!isValid || linkUsers.isPending}>
            {t('save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

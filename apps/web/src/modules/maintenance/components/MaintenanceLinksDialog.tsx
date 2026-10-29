'use client'

import * as maintenanceStyles from '../styles/maintenance-links-dialog.styles'

import { zodResolver } from '@hookform/resolvers/zod'
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
import { RhfTextField } from '@shared/components/form'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useMaintenanceOptions, useRegularizeMaintenanceLinks } from '../hooks/use-maintenance'
import { useMaintenanceErrorMessage } from '../hooks/use-maintenance-error-message'
import { createMaintenanceLinksSchema } from '../schemas/maintenance-links-schema'
import type { MaintenanceLinksDialogProps } from '../types/maintenance'
import type { MaintenanceLinksFormValues } from '../types/maintenance-links'

export function MaintenanceLinksDialog(props: MaintenanceLinksDialogProps) {
  return props.open ? <MaintenanceLinksForm {...props} /> : null
}

function MaintenanceLinksForm({ onClose }: MaintenanceLinksDialogProps) {
  const errorMessage = useMaintenanceErrorMessage()
  const t = useTranslations('dashboard.maintenance.links')
  const { data: options } = useMaintenanceOptions()
  const mutation = useRegularizeMaintenanceLinks()
  const { enqueueSnackbar } = useSnackbar()
  const schema = useMemo(() => createMaintenanceLinksSchema((key) => t(`validation.${key}`)), [t])
  const {
    control,
    handleSubmit,
    setValue,
    formState: { isValid },
  } = useForm<MaintenanceLinksFormValues>({
    defaultValues: { contractId: '', ownerId: '', partyId: '', renterId: '' },
    resolver: zodResolver(schema),
    mode: 'onChange',
  })
  const contractId = useWatch({ control, name: 'contractId' })
  const partyId = useWatch({ control, name: 'partyId' })
  const contract = options?.contracts.find((item) => item.id === contractId)

  async function submit(values: MaintenanceLinksFormValues) {
    try {
      await mutation.mutateAsync({
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
    <Dialog open onClose={() => !mutation.isPending && onClose()} fullWidth maxWidth="sm">
      <form noValidate onSubmit={handleSubmit(submit)}>
        <DialogTitle>{t('title')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={maintenanceStyles.stackSx}>
            <Controller
              control={control}
              name="contractId"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label={t('contract')}
                  required
                  select
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  onChange={(event) => {
                    field.onChange(event)
                    setValue('ownerId', '', { shouldValidate: true })
                    setValue('partyId', '', { shouldValidate: true })
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
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label={t('party')}
                  select
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  onChange={(event) => {
                    field.onChange(event)
                    setValue('renterId', '', { shouldValidate: true })
                  }}
                >
                  <MenuItem value="">{t('unchanged')}</MenuItem>
                  {(contract?.parties ?? [])
                    .filter((party) => party.role === 'RENTER')
                    .map((party) => (
                      <MenuItem key={party.id} value={party.id}>
                        {party.name}
                      </MenuItem>
                    ))}
                </TextField>
              )}
            />
            {partyId && (
              <RhfTextField control={control} name="renterId" label={t('renter')} required select>
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
          <Button disabled={mutation.isPending} onClick={onClose}>
            {t('back')}
          </Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending || !isValid}>
            {t('save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

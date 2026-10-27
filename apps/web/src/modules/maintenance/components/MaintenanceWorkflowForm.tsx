'use client'

import * as maintenanceStyles from '../styles/maintenance-workflow-form.styles'

import { MaintenanceProviderPicker } from './MaintenanceProviderPicker'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import { RhfTextField } from '@shared/components/form'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useMaintenanceOptions } from '../hooks/use-maintenance'
import { createMaintenanceWorkflowSchema } from '../schemas/maintenance-workflow-schema'
import type {
  MaintenanceWorkflowFormProps,
  MaintenanceWorkflowFormValues,
} from '../types/maintenance-workflow'

export function MaintenanceWorkflowForm({
  ticket,
  selection,
  role,
  isPending,
  onSubmit,
  onClose,
}: MaintenanceWorkflowFormProps) {
  const t = useTranslations('dashboard.maintenance.workflow')
  const { data: options } = useMaintenanceOptions()
  const schema = useMemo(
    () => createMaintenanceWorkflowSchema(selection.action, role, (key) => t(`validation.${key}`)),
    [selection.action, role, t],
  )
  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<MaintenanceWorkflowFormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      catalogProvider: null,
      reason: '',
      responsibleId: ticket.responsibleId ?? '',
      contractId: '',
      status: 'ABERTO',
      name: selection.action === 'approveReplacement' ? '' : (ticket.provider?.name ?? ''),
      phone: selection.action === 'approveReplacement' ? '' : (ticket.provider?.phone ?? ''),
      email: selection.action === 'approveReplacement' ? '' : (ticket.provider?.email ?? ''),
      notes: selection.action === 'approveReplacement' ? '' : (ticket.provider?.notes ?? ''),
    },
  })
  const catalogProvider = useWatch({ control, name: 'catalogProvider' })
  const providerAction =
    selection.action === 'provider' || selection.action === 'approveReplacement'
  const reasonAction =
    ['contest', 'requestReplacement', 'rejectReplacement'].includes(selection.action) ||
    (selection.action === 'reopen' && role === 'RENTER')
  return (
    <Dialog open onClose={() => !isPending && onClose()} fullWidth maxWidth="sm">
      <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{t(selection.action)}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={maintenanceStyles.stackSx}>
            {selection.action === 'linkContract' && (
              <>
                <Typography variant="body2">{t('linkContractHelp')}</Typography>
                <RhfTextField
                  label={t('contract')}
                  control={control}
                  name="contractId"
                  select
                  required
                >
                  {(options?.contracts ?? [])
                    .filter((contract) => contract.propertyId === ticket.propertyId)
                    .map((contract) => (
                      <MenuItem key={contract.id} value={contract.id}>
                        {contract.code} - {contract.propertyTitle}
                      </MenuItem>
                    ))}
                </RhfTextField>
              </>
            )}
            {selection.action === 'finish' && <Typography>{t('finishConfirmation')}</Typography>}
            {reasonAction && (
              <RhfTextField
                label={t('reason')}
                control={control}
                name="reason"
                required
                multiline
                minRows={3}
                inputProps={{ maxLength: 5000 }}
              />
            )}
            {selection.action === 'assign' && (
              <RhfTextField
                label={t('responsible')}
                control={control}
                name="responsibleId"
                select
                required
              >
                {(options?.users ?? [])
                  .filter((user) => user.role !== 'RENTER')
                  .map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))}
              </RhfTextField>
            )}
            {selection.action === 'reopen' && role !== 'RENTER' && (
              <RhfTextField label={t('reopenStatus')} control={control} name="status" select>
                <MenuItem value="ABERTO">{t('open')}</MenuItem>
                <MenuItem value="EM_ANDAMENTO">{t('inProgress')}</MenuItem>
              </RhfTextField>
            )}
            {providerAction && <MaintenanceProviderPicker control={control} ticketId={ticket.id} />}
            {providerAction && !catalogProvider && (
              <>
                <RhfTextField
                  label={t('name')}
                  control={control}
                  name="name"
                  required
                  inputProps={{ maxLength: 200 }}
                />
                <RhfTextField
                  label={t('phone')}
                  control={control}
                  name="phone"
                  inputProps={{ maxLength: 50 }}
                />
                <RhfTextField label={t('email')} type="email" control={control} name="email" />
                <RhfTextField
                  label={t('notes')}
                  control={control}
                  name="notes"
                  multiline
                  minRows={2}
                  inputProps={{ maxLength: 5000 }}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={isPending} onClick={onClose}>
            {t('back')}
          </Button>
          <Button type="submit" variant="contained" disabled={!isValid || isPending}>
            {t('save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

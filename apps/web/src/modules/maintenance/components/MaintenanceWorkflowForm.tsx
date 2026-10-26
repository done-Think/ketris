'use client'

import { useMemo } from 'react'
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useForm } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'

import { useMaintenanceAction, useMaintenanceOptions } from '../hooks/use-maintenance'
import { createMaintenanceWorkflowSchema } from '../schemas/maintenance-workflow-schema'
import type {
  MaintenanceWorkflowFormProps,
  MaintenanceWorkflowFormValues,
} from '../types/maintenance'
import { errorMessage } from '../utils/error-message'
import {
  buildMaintenanceWorkflowAction,
  maintenanceWorkflowDefaultValues,
  maintenanceWorkflowRequirements,
} from '../utils/maintenance-workflow'

// Mounted once per chosen action, so its schema and defaults never carry over between actions.
export function MaintenanceWorkflowForm({
  ticket,
  selection,
  onDone,
}: MaintenanceWorkflowFormProps) {
  const t = useTranslations('dashboard.maintenance.workflow')
  const { data: session } = useSession()
  const { data: options } = useMaintenanceOptions()
  const mutation = useMaintenanceAction(session?.tenantId, ticket.id)
  const { enqueueSnackbar } = useSnackbar()
  const isRenter = session?.role === 'RENTER'
  const required = useMemo(
    () => maintenanceWorkflowRequirements(selection.action, isRenter),
    [selection.action, isRenter],
  )
  const schema = useMemo(
    () => createMaintenanceWorkflowSchema((key) => t(`errors.${key}`), required),
    [t, required],
  )
  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<MaintenanceWorkflowFormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: maintenanceWorkflowDefaultValues(ticket, selection.action),
  })

  async function submit(values: MaintenanceWorkflowFormValues) {
    try {
      await mutation.mutateAsync(buildMaintenanceWorkflowAction(selection, values, isRenter))
      onDone()
      enqueueSnackbar(t('success'), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('error')), { variant: 'error' })
    }
  }

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(submit)}>
      <DialogTitle>{t(selection.action)}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {required.contract && (
            <>
              <Typography variant="body2">{t('linkContractHelp')}</Typography>
              <RhfTextField
                control={control}
                name="contractId"
                label={t('contract')}
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
          {required.reason && (
            <RhfTextField
              control={control}
              name="reason"
              label={t('reason')}
              required
              multiline
              minRows={3}
              slotProps={{ htmlInput: { maxLength: 5000 } }}
            />
          )}
          {required.responsible && (
            <RhfTextField
              control={control}
              name="responsibleId"
              label={t('responsible')}
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
          {selection.action === 'reopen' && !isRenter && (
            <RhfTextField control={control} name="status" label={t('reopenStatus')} select>
              <MenuItem value="ABERTO">{t('open')}</MenuItem>
              <MenuItem value="EM_ANDAMENTO">{t('inProgress')}</MenuItem>
            </RhfTextField>
          )}
          {required.provider && (
            <>
              <RhfTextField
                control={control}
                name="providerName"
                label={t('name')}
                required
                slotProps={{ htmlInput: { maxLength: 200 } }}
              />
              <RhfTextField
                control={control}
                name="providerPhone"
                label={t('phone')}
                slotProps={{ htmlInput: { maxLength: 50 } }}
              />
              <RhfTextField
                control={control}
                name="providerEmail"
                label={t('email')}
                type="email"
              />
              <RhfTextField
                control={control}
                name="providerNotes"
                label={t('notes')}
                multiline
                minRows={2}
                slotProps={{ htmlInput: { maxLength: 5000 } }}
              />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={mutation.isPending} onClick={onDone}>
          {t('back')}
        </Button>
        <Button type="submit" variant="contained" disabled={!isValid || mutation.isPending}>
          {t('save')}
        </Button>
      </DialogActions>
    </Box>
  )
}

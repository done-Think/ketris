'use client'

import * as maintenanceStyles from '../styles/maintenance-schedule.styles'

import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Box, Button, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'
import { useMaintenanceAction } from '../hooks/use-maintenance'
import { useMaintenanceErrorMessage } from '../hooks/use-maintenance-error-message'
import { createMaintenanceScheduleSchema } from '../schemas/maintenance-ticket-schema'
import type { MaintenanceScheduleFormValues, MaintenanceScheduleProps } from '../types/maintenance'
import {
  buildMaintenanceScheduleAction,
  mapMaintenanceScheduleToFormValues,
} from '../utils/maintenance-adapter'

export function MaintenanceSchedule({ ticket }: MaintenanceScheduleProps) {
  const errorMessage = useMaintenanceErrorMessage()
  const t = useTranslations('dashboard.maintenance.schedule')
  const { enqueueSnackbar } = useSnackbar()
  const mutation = useMaintenanceAction(ticket.id)
  const schema = useMemo(() => createMaintenanceScheduleSchema((key) => t(key)), [t])
  const { control, handleSubmit, reset } = useForm<MaintenanceScheduleFormValues>({
    values: mapMaintenanceScheduleToFormValues(ticket),
    resetOptions: { keepDirtyValues: true, keepErrors: true },
    resolver: zodResolver(schema),
  })
  const canSchedule = Boolean(ticket.provider && ticket.permissions?.schedule)

  async function submit(values: MaintenanceScheduleFormValues) {
    if (!canSchedule || mutation.isPending) return
    try {
      await mutation.mutateAsync(buildMaintenanceScheduleAction(values))
      reset(values)
      enqueueSnackbar(t('success'), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('error')), { variant: 'error' })
    }
  }

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(submit)} sx={maintenanceStyles.boxSx}>
      <Typography variant="subtitle2" sx={maintenanceStyles.typographySx}>
        {t('title')}
      </Typography>
      <Box sx={maintenanceStyles.boxSx2}>
        <Box sx={maintenanceStyles.boxSx3}>
          <RhfTextField
            control={control}
            name="scheduledDate"
            type="date"
            label={t('dateLabel')}
            disabled={!canSchedule || mutation.isPending}
            helperText={!ticket.provider ? t('providerRequired') : undefined}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={maintenanceStyles.rhfTextFieldSx}
          />
          <RhfTextField
            control={control}
            name="scheduledHour"
            label={t('hourLabel')}
            select
            disabled={!canSchedule || mutation.isPending}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
            sx={maintenanceStyles.rhfTextFieldSx2}
          >
            <option value="">--</option>
            {Array.from({ length: 24 }, (_, hour) => {
              const value = String(hour).padStart(2, '0')
              return (
                <option key={value} value={value}>
                  {value}
                </option>
              )
            })}
          </RhfTextField>
          <RhfTextField
            control={control}
            name="scheduledMinute"
            label={t('minuteLabel')}
            select
            disabled={!canSchedule || mutation.isPending}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
            sx={maintenanceStyles.rhfTextFieldSx3}
          >
            <option value="">--</option>
            {Array.from({ length: 60 }, (_, minute) => {
              const value = String(minute).padStart(2, '0')
              return (
                <option key={value} value={value}>
                  {value}
                </option>
              )
            })}
          </RhfTextField>
        </Box>
        <Alert severity="info" sx={maintenanceStyles.alertSx}>
          {t('coordinationNotice')}
        </Alert>
        <Button
          type="submit"
          variant="outlined"
          disabled={!canSchedule || mutation.isPending}
          sx={maintenanceStyles.buttonSx}
        >
          {t('save')}
        </Button>
      </Box>
    </Box>
  )
}

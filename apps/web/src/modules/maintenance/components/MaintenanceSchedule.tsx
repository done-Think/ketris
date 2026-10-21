'use client'

import { useEffect, useMemo } from 'react'
import { Alert, Box, Button, Typography } from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import { RhfTextField } from '@shared/components/form'
import { useMaintenanceAction } from '../hooks/use-maintenance'
import { createMaintenanceScheduleSchema } from '../schemas/maintenance-ticket-schema'
import type { MaintenanceScheduleFormValues, MaintenanceScheduleProps } from '../types/maintenance'
import {
  buildMaintenanceScheduleAction,
  mapMaintenanceScheduleToFormValues,
} from '../utils/maintenance-adapter'
import { errorMessage } from '../utils/error-message'

export function MaintenanceSchedule({ ticket }: MaintenanceScheduleProps) {
  const t = useTranslations('dashboard.maintenance.schedule')
  const { data: session } = useSession()
  const { enqueueSnackbar } = useSnackbar()
  const mutation = useMaintenanceAction(session?.tenantId, ticket.id)
  const schema = useMemo(() => createMaintenanceScheduleSchema((key) => t(key)), [t])
  const { control, handleSubmit, reset } = useForm<MaintenanceScheduleFormValues>({
    defaultValues: mapMaintenanceScheduleToFormValues(ticket),
    resolver: zodResolver(schema),
  })
  const canSchedule = Boolean(ticket.provider && ticket.permissions?.schedule)

  useEffect(() => {
    reset(mapMaintenanceScheduleToFormValues({ scheduledAt: ticket.scheduledAt }))
  }, [ticket.id, ticket.scheduledAt, reset])

  async function submit(values: MaintenanceScheduleFormValues) {
    if (!canSchedule || mutation.isPending) return
    try {
      await mutation.mutateAsync(buildMaintenanceScheduleAction(values))
      enqueueSnackbar(t('success'), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('error')), { variant: 'error' })
    }
  }

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(submit)} sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {t('title')}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'minmax(0, 344px) auto' },
          gridTemplateAreas: {
            xs: '"date" "notice" "save"',
            sm: '"date save" "notice notice"',
          },
          gap: 1.5,
          alignItems: 'start',
        }}
      >
        <Box
          sx={{
            gridArea: 'date',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            '& input, & select': { textAlign: 'center' },
            '& input::-webkit-datetime-edit': { textAlign: 'center' },
            '& .MuiInputLabel-shrink': {
              left: '50%',
              transform: 'translate(-50%, -9px) scale(0.75)',
              transformOrigin: 'top center',
            },
            '& .MuiOutlinedInput-notchedOutline legend': { marginInline: 'auto' },
          }}
        >
          <RhfTextField
            control={control}
            name="scheduledDate"
            type="date"
            label={t('dateLabel')}
            disabled={!canSchedule || mutation.isPending}
            helperText={!ticket.provider ? t('providerRequired') : undefined}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 160, maxWidth: '100%' }}
          />
          <RhfTextField
            control={control}
            name="scheduledHour"
            label={t('hourLabel')}
            select
            disabled={!canSchedule || mutation.isPending}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
            sx={{ width: 85 }}
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
            sx={{ width: 75 }}
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
        <Alert severity="info" sx={{ gridArea: 'notice' }}>
          {t('coordinationNotice')}
        </Alert>
        <Button
          type="submit"
          variant="outlined"
          disabled={!canSchedule || mutation.isPending}
          sx={{ gridArea: 'save', justifySelf: 'start', alignSelf: 'center' }}
        >
          {t('save')}
        </Button>
      </Box>
    </Box>
  )
}

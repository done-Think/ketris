'use client'

import { styles } from '../styles/agenda-event-form-dialog.styles'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'

import { buildAgendaEventFormSchema } from '../schemas/agenda-event-form-schema'
import type { AgendaEventFormDialogProps, AgendaEventFormValues } from '../types/agenda-event'
import { computeEarliestSchedulableSlot } from '../utils/scheduling-window'
import { AgendaScheduleConfirmationDialog } from './AgendaScheduleConfirmationDialog'
import { AgendaEventFormFields } from './AgendaEventFormFields'
import { useAgendaScheduleConfirmation } from '../hooks/use-agenda-schedule-confirmation'

function buildDefaultValues(): AgendaEventFormValues {
  const earliestSlot = computeEarliestSchedulableSlot()

  return {
    outsideBusinessHoursConfirmed: false,
    internal: false,
    audience: 'SHARED_TEAM',
    responsibleId: '',
    customProperty: '',
    durationMinutes: 60,
    kind: '',
    notes: '',
    participant: '',
    phone: '',
    propertyId: '',
    scheduledDate: earliestSlot.format('YYYY-MM-DD'),
    scheduledTime: earliestSlot.format('HH:mm'),
    title: '',
  }
}

export function AgendaEventFormDialog(props: AgendaEventFormDialogProps) {
  return props.open ? <AgendaEventFormDialogContent {...props} /> : null
}

function AgendaEventFormDialogContent({
  canManageAudience = false,
  agentOptions,
  agentsLoading,
  agentsError,
  initialValues,
  maxDate,
  minDate,
  onClose,
  onCreate,
  open,
  propertyOptions,
}: AgendaEventFormDialogProps) {
  const t = useTranslations('agenda.eventForm')
  const agendaEventFormSchema = useMemo(
    () => buildAgendaEventFormSchema((key) => t(`errors.${key}`)),
    [t],
  )
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<AgendaEventFormValues>({
    defaultValues: {
      ...buildDefaultValues(),
      ...(canManageAudience ? { audience: 'ALL_AGENTS' as const } : {}),
      ...initialValues,
    },
    resolver: zodResolver(agendaEventFormSchema),
  })

  const { submit, confirm, waiting, cancel } = useAgendaScheduleConfirmation({
    open,
    handleSubmit,
    onSubmit: onCreate,
  })
  const closeDialog = () => {
    cancel()
    onClose()
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: styles.paper }}
      >
        <Box component="form" noValidate onSubmit={handleSubmit(submit)}>
          <DialogTitle sx={styles.dialogTitle}>
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={2}
            >
              <Box sx={styles.box}>
                <Typography sx={styles.typography}>{t('eyebrow')}</Typography>
                <Typography sx={styles.typography2}>{t('title')}</Typography>
              </Box>
              <IconButton aria-label={t('closeAriaLabel')} onClick={closeDialog}>
                <CloseRoundedIcon sx={styles.closeRoundedIcon} />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent sx={styles.dialogContent}>
            <AgendaEventFormFields
              canManageAudience={canManageAudience}
              agentOptions={agentOptions}
              agentsLoading={agentsLoading}
              agentsError={agentsError}
              control={control}
              maxDate={maxDate}
              minDate={minDate}
              propertyOptions={propertyOptions}
            />
          </DialogContent>

          <DialogActions sx={styles.dialogActions}>
            <Button type="button" variant="outlined" color="secondary" onClick={closeDialog}>
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<AddRoundedIcon />}
              disabled={isSubmitting}
            >
              {t('submit')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      <AgendaScheduleConfirmationDialog
        open={waiting}
        isPending={isSubmitting}
        onBack={cancel}
        onConfirm={confirm}
      />
    </>
  )
}

'use client'

import { styles } from '../styles/agenda-event-detail-dialog.styles'

import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link as MuiLink,
  Stack,
  Typography,
} from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFormatter, useTranslations } from 'next-intl'
import { Fragment, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Link } from '@/i18n/navigation'

import {
  agendaOtherPropertyValue,
  buildAgendaEventFormSchema,
} from '../schemas/agenda-event-form-schema'
import type {
  AgendaEvent,
  AgendaEventDetailDialogProps,
  AgendaEventFormValues,
  CancelAgendaEventValues,
} from '../types/agenda-event'
import { AgendaScheduleConfirmationDialog } from './AgendaScheduleConfirmationDialog'
import { AgendaEventFormFields } from './AgendaEventFormFields'
import { CancelAgendaEventDialog } from './CancelAgendaEventDialog'
import { useAgendaScheduleConfirmation } from '../hooks/use-agenda-schedule-confirmation'

function buildEditFormValues(event: AgendaEvent): AgendaEventFormValues {
  const hasKnownProperty = Boolean(event.propertyId)

  return {
    outsideBusinessHoursConfirmed: false,
    internal: event.internal ?? false,
    audience: event.audience ?? 'SHARED_TEAM',
    responsibleId: event.responsibleId ?? '',
    customProperty: hasKnownProperty ? '' : event.property,
    durationMinutes: event.durationMinutes,
    kind: event.apiKind ?? '',
    notes: event.notes,
    participant: event.participant,
    phone: event.phone,
    propertyId: hasKnownProperty
      ? (event.propertyId as string)
      : event.property
        ? agendaOtherPropertyValue
        : '',
    scheduledDate: event.scheduledDate,
    scheduledTime: event.time,
    title: event.title,
  }
}

export function AgendaEventDetailDialog(props: AgendaEventDetailDialogProps) {
  return props.open && props.event ? (
    <AgendaEventDetailDialogContent key={props.event.id} {...props} />
  ) : null
}

function AgendaEventDetailDialogContent({
  readOnly = false,
  hidePrivateDetails = readOnly,
  canManageAudience = false,
  agentOptions,
  agentsLoading,
  agentsError,
  event,
  isDeleting,
  isSaving,
  maxDate,
  minDate,
  onClose,
  onDelete,
  onEdit,
  open,
  propertyOptions,
}: AgendaEventDetailDialogProps) {
  const formatter = useFormatter()
  const t = useTranslations('agenda.eventDetail')
  const agendaT = useTranslations('agenda.dashboard')
  const formT = useTranslations('agenda.eventForm')
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const editFormSchema = useMemo(
    () =>
      buildAgendaEventFormSchema((key) => formT(`errors.${key}`), {
        unchangedScheduleDate: event?.scheduledDate,
        unchangedScheduleTime: event?.time,
      }),
    [event?.scheduledDate, event?.time, formT],
  )
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<AgendaEventFormValues>({
    defaultValues: event ? buildEditFormValues(event) : undefined,
    resolver: zodResolver(editFormSchema),
  })
  const {
    submit: submitEdit,
    waiting,
    confirm,
    cancel,
  } = useAgendaScheduleConfirmation({
    open: open && mode === 'edit' && !readOnly,
    handleSubmit,
    unchangedSchedule: event
      ? {
          scheduledDate: event.scheduledDate,
          scheduledTime: event.time,
          durationMinutes: event.durationMinutes,
        }
      : undefined,
    onSubmit: async (values) => {
      if (!readOnly && (await onEdit(values))) setMode('view')
    },
  })

  const closeDialog = () => {
    cancel()
    setMode('view')
    onClose()
  }

  const startEditing = () => {
    if (!event || readOnly) return

    reset(buildEditFormValues(event))
    setMode('edit')
  }

  const cancelEditing = () => {
    cancel()
    setMode('view')
  }

  const confirmDelete = async ({ reason }: CancelAgendaEventValues) => {
    if (readOnly) return
    const success = await onDelete(reason)
    if (success) {
      setIsDeleteDialogOpen(false)
      closeDialog()
    }
  }

  if (!event) return null

  const formattedEventDate = formatter.dateTime(new Date(`${event.scheduledDate}T00:00:00Z`), {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })

  return (
    <>
      <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="sm">
        <Box component="form" noValidate onSubmit={handleSubmit(submitEdit)}>
          <DialogTitle sx={styles.dialogTitle}>
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={2}
            >
              <Box sx={styles.box}>
                <Typography sx={styles.typography}>
                  {event.time} · {formattedEventDate}
                </Typography>
                <Typography sx={styles.typography2}>
                  {!readOnly && mode === 'edit' ? t('editTitle') : event.title}
                </Typography>
              </Box>
              <IconButton aria-label={t('closeAriaLabel')} onClick={closeDialog}>
                <CloseRoundedIcon sx={styles.closeRoundedIcon} />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent sx={styles.dialogContent}>
            {!readOnly && mode === 'edit' ? (
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
            ) : (
              <Stack spacing={2}>
                <Box sx={styles.box2}>
                  <Stack spacing={1.3}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <HomeWorkOutlinedIcon sx={styles.homeWorkOutlinedIcon} />
                      {event.property && !readOnly ? (
                        <MuiLink
                          component={Link}
                          href={event.propertyHref}
                          underline="hover"
                          sx={styles.muiLink}
                        >
                          {event.property}
                        </MuiLink>
                      ) : (
                        <Typography sx={styles.typography3}>
                          {event.property || t('noProperty')}
                        </Typography>
                      )}
                    </Stack>
                    {!hidePrivateDetails && (event.participant || event.phone) && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PhoneOutlinedIcon sx={styles.phoneOutlinedIcon} />
                        <Typography sx={styles.typography4}>
                          {[event.participant, event.phone].filter(Boolean).join(' · ')}
                        </Typography>
                      </Stack>
                    )}
                    {readOnly && event.responsibleName && (
                      <Typography sx={styles.typography5}>
                        {t('responsible', { name: event.responsibleName })}
                      </Typography>
                    )}
                    {!hidePrivateDetails && event.audience && event.audience !== 'SHARED_TEAM' && (
                      <Typography sx={styles.typography6}>
                        {formT(`audiences.${event.audience}`)}
                        {event.audience === 'ASSIGNED_AGENT' && event.responsibleName
                          ? ` · ${event.responsibleName}`
                          : ''}
                      </Typography>
                    )}
                    {event.createdBy && event.createdByRole ? (
                      <Typography sx={styles.typography7}>
                        {t('createdBy', {
                          name: event.createdBy,
                          role: agendaT(`creatorRoles.${event.createdByRole}`),
                        })}
                      </Typography>
                    ) : null}
                  </Stack>
                </Box>

                {!hidePrivateDetails && (
                  <Box>
                    <Typography sx={styles.typography8}>{t('notesTitle')}</Typography>
                    <Typography sx={styles.typography9}>{event.notes}</Typography>
                  </Box>
                )}
              </Stack>
            )}
          </DialogContent>

          {!readOnly && (
            <DialogActions sx={styles.dialogActions}>
              {mode === 'edit' ? (
                <Fragment key="edit-actions">
                  <Button
                    type="button"
                    variant="outlined"
                    color="secondary"
                    onClick={cancelEditing}
                  >
                    {t('cancelEdit')}
                  </Button>
                  <Button type="submit" variant="contained" disabled={isSaving || isSubmitting}>
                    {isSaving ? <CircularProgress size={20} /> : t('save')}
                  </Button>
                </Fragment>
              ) : (
                <Fragment key="view-actions">
                  <Button
                    type="button"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteOutlineRoundedIcon sx={styles.deleteOutlineRoundedIcon} />}
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    {t('delete')}
                  </Button>
                  <Button
                    type="button"
                    variant="contained"
                    startIcon={<EditRoundedIcon sx={styles.editRoundedIcon} />}
                    onClick={startEditing}
                  >
                    {t('edit')}
                  </Button>
                </Fragment>
              )}
            </DialogActions>
          )}
        </Box>
      </Dialog>

      <AgendaScheduleConfirmationDialog
        open={!readOnly && waiting}
        isPending={isSubmitting || isSaving}
        onBack={cancel}
        onConfirm={confirm}
      />
      {!readOnly && (
        <CancelAgendaEventDialog
          open={isDeleteDialogOpen}
          isPending={isDeleting}
          title={event.title}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  )
}

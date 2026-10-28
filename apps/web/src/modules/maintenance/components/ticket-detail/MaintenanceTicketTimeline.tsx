'use client'

import * as maintenanceStyles from '../../styles/maintenance-ticket-timeline.styles'

import { formatMaintenanceActivity } from '../../utils/maintenance-activity'

import { zodResolver } from '@hookform/resolvers/zod'
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded'
import { Avatar, Box, Button, CircularProgress, Divider, Stack, Typography } from '@mui/material'
import { RhfTextField } from '@shared/components/form'
import { useFormatter, useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import type { ChangeEvent } from 'react'
import { useMemo, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import {
  useAddMaintenanceTicketNote,
  useUploadMaintenanceTicketAttachment,
} from '../../hooks/use-maintenance'
import { useMaintenanceErrorMessage } from '../../hooks/use-maintenance-error-message'
import { createMaintenanceNoteSchema } from '../../schemas/maintenance-note-schema'
import {
  cardSx,
  cardTitleSx,
  primaryButtonSx,
  secondaryButtonSx,
} from '../../styles/maintenance-ticket-detail.styles'
import type {
  MaintenanceNoteFormValues,
  MaintenanceTicketSectionProps,
} from '../../types/maintenance-detail'

export function MaintenanceTicketTimeline({ ticket }: MaintenanceTicketSectionProps) {
  const errorMessage = useMaintenanceErrorMessage()
  const t = useTranslations('dashboard.maintenance')
  const detailT = useTranslations('dashboard.maintenance.detail')
  const ticketId = ticket.id
  const { enqueueSnackbar } = useSnackbar()

  const formatter = useFormatter()
  const schema = useMemo(
    () => createMaintenanceNoteSchema((key) => detailT(`timeline.validation.${key}`)),
    [detailT],
  )
  const { control, handleSubmit, reset } = useForm<MaintenanceNoteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { message: '' },
  })
  const message = useWatch({ control, name: 'message' })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const addNoteMutation = useAddMaintenanceTicketNote(ticketId)

  const uploadAttachmentMutation = useUploadMaintenanceTicketAttachment(ticketId)

  async function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      await uploadAttachmentMutation.mutateAsync(file)
      enqueueSnackbar(t('notifications.attachmentSuccess'), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('notifications.attachmentError')), {
        variant: 'error',
      })
    }
  }

  async function handleSendMessage(values: MaintenanceNoteFormValues) {
    if (!ticket.permissions?.comment || addNoteMutation.isPending) return

    try {
      await addNoteMutation.mutateAsync(values.message)
      enqueueSnackbar(t('notifications.noteSuccess'), { variant: 'success' })
      reset()
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('notifications.noteError')), { variant: 'error' })
    }
  }

  const sortedActivities = [...ticket.activities].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  )
  return (
    <Box sx={cardSx}>
      <Typography sx={cardTitleSx}>{detailT('timeline.title')}</Typography>
      {sortedActivities.length > 0 ? (
        <Stack spacing={1.7} sx={maintenanceStyles.stackSx}>
          {sortedActivities.map((activity) => (
            <Stack key={activity.id} direction="row" spacing={1.2}>
              <Avatar sx={maintenanceStyles.avatarSx}>{getInitials(activity.authorName)}</Avatar>
              <Box>
                <Stack
                  direction="row"
                  flexWrap="wrap"
                  spacing={0.75}
                  useFlexGap
                  alignItems="baseline"
                >
                  <Typography sx={maintenanceStyles.typographySx}>
                    {activity.authorName ?? detailT('timeline.systemAuthor')}
                  </Typography>
                  <Typography sx={maintenanceStyles.typographySx2}>
                    •{' '}
                    {formatter.dateTime(new Date(activity.createdAt), {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </Typography>
                </Stack>
                <Typography sx={maintenanceStyles.typographySx3}>
                  {formatMaintenanceActivity(activity, (key, values) => t(key, values))}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      ) : (
        <Typography sx={maintenanceStyles.typographySx4}>{detailT('timeline.empty')}</Typography>
      )}
      <Divider sx={maintenanceStyles.dividerSx} />
      <RhfTextField
        control={control}
        name="message"
        disabled={!ticket.permissions?.comment || addNoteMutation.isPending}
        multiline
        minRows={4}
        placeholder={detailT('timeline.placeholder')}
        fullWidth
        sx={maintenanceStyles.rhfTextFieldSx}
      />
      <Stack direction="row" justifyContent="space-between" sx={maintenanceStyles.stackSx2}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={handleAttachmentChange}
        />
        <Button
          variant="outlined"
          startIcon={
            uploadAttachmentMutation.isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <AttachFileRoundedIcon />
            )
          }
          sx={secondaryButtonSx}
          disabled={!ticket.permissions?.collaborate || uploadAttachmentMutation.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          {detailT('actions.attachFiles')}
        </Button>
        <Button
          variant="contained"
          disabled={!ticket.permissions?.comment || !message.trim() || addNoteMutation.isPending}
          sx={primaryButtonSx}
          onClick={handleSubmit(handleSendMessage)}
        >
          {detailT('actions.sendMessage')}
        </Button>
      </Stack>
    </Box>
  )
}
function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

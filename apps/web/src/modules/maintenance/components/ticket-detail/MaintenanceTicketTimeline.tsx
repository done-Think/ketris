'use client'

import type { ChangeEvent } from 'react'
import { useRef, useState } from 'react'
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded'
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { formatDate } from '@shared/lib/utils/format'
import { alpha, brand, surface } from '@shared/theme/tokens'
import {
  useAddMaintenanceTicketNote,
  useUploadMaintenanceTicketAttachment,
} from '../../hooks/use-maintenance'
import { errorMessage } from '../../utils/error-message'
import type { MaintenanceTicketSectionProps } from '../../types/maintenance-detail'
import { cardSx, cardTitleSx, secondaryButtonSx, primaryButtonSx } from './styles'

export function MaintenanceTicketTimeline({ ticket }: MaintenanceTicketSectionProps) {
  const t = useTranslations('dashboard.maintenance')
  const detailT = useTranslations('dashboard.maintenance.detail')
  const ticketId = ticket.id
  const { data: session } = useSession()
  const tenantId = session?.tenantId
  const { enqueueSnackbar } = useSnackbar()

  const [message, setMessage] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const addNoteMutation = useAddMaintenanceTicketNote(tenantId, ticketId)

  const uploadAttachmentMutation = useUploadMaintenanceTicketAttachment(tenantId, ticketId)

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

  async function handleSendMessage() {
    const trimmedMessage = message.trim()
    if (!trimmedMessage) return

    try {
      await addNoteMutation.mutateAsync(trimmedMessage)
      enqueueSnackbar(t('notifications.noteSuccess'), { variant: 'success' })
      setMessage('')
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
        <Stack spacing={1.7} sx={{ mt: 1.7 }}>
          {sortedActivities.map((activity) => (
            <Stack key={activity.id} direction="row" spacing={1.2}>
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: brand.graphite[400],
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                {getInitials(activity.authorName)}
              </Avatar>
              <Box>
                <Stack
                  direction="row"
                  flexWrap="wrap"
                  spacing={0.75}
                  useFlexGap
                  alignItems="baseline"
                >
                  <Typography sx={{ fontSize: 12, color: brand.graphite[500], fontWeight: 900 }}>
                    {activity.authorName ?? detailT('timeline.systemAuthor')}
                  </Typography>
                  <Typography sx={{ fontSize: 10.5, color: brand.neutral[400] }}>
                    • {formatDate(activity.createdAt, 'DD/MM/YYYY HH:mm')}
                  </Typography>
                </Stack>
                <Typography
                  sx={{
                    mt: 0.45,
                    color: brand.neutral[600],
                    fontSize: 12,
                    lineHeight: 1.5,
                  }}
                >
                  {activity.message}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      ) : (
        <Typography sx={{ mt: 1.7, color: brand.neutral[400], fontSize: 12 }}>
          {detailT('timeline.empty')}
        </Typography>
      )}
      <Divider sx={{ my: 1.7 }} />
      <TextField
        value={message}
        disabled={!ticket.permissions?.comment}
        onChange={(event) => setMessage(event.target.value)}
        multiline
        minRows={4}
        placeholder={detailT('timeline.placeholder')}
        fullWidth
        sx={{
          '& .MuiInputBase-root': { bgcolor: surface.app, fontSize: 12, lineHeight: 1.5 },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha.graphite[8] },
        }}
      />
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
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
          onClick={handleSendMessage}
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

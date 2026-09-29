'use client'

import { useState } from 'react'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined'
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import { Link } from '@/i18n/navigation'
import { formatDate } from '@shared/lib/utils/format'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import {
  useAddMaintenanceTicketNote,
  useMaintenanceTicket,
  useResolveMaintenanceTicket,
} from '../hooks/use-maintenance'
import type { MaintenancePriority, MaintenanceStatus } from '../types/maintenance'
import { errorMessage } from '../utils/error-message'
import {
  mapMaintenancePriorityFromApi,
  mapMaintenanceStatusFromApi,
} from '../utils/maintenance-adapter'

const statusStyles: Record<MaintenanceStatus, { bgcolor: string; color: string }> = {
  inProgress: { bgcolor: '#FFF2CC', color: '#D98900' },
  open: { bgcolor: '#E8F1FF', color: '#2877E8' },
  resolved: { bgcolor: '#E5F8ED', color: '#12A150' },
  closed: { bgcolor: '#EFF1F4', color: '#617086' },
}
const priorityColors: Record<MaintenancePriority, string> = {
  urgent: brand.semantic.error,
  high: '#F59E0B',
  normal: brand.neutral[400],
}

const cardSx = {
  bgcolor: surface.paper,
  border: '1px solid',
  borderColor: alpha.graphite[8],
  borderRadius: `${radius.sm}px`,
  boxShadow: shadows.crmCardCompact,
  p: { xs: 2, md: 2.4 },
} as const
const labelSx = {
  color: brand.neutral[400],
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
} as const

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function MaintenanceTicketDetailPage({ ticketId }: { ticketId: string }) {
  const t = useTranslations('dashboard.maintenance')
  const detailT = useTranslations('dashboard.maintenance.detail')
  const { enqueueSnackbar } = useSnackbar()
  const { data: session } = useSession()
  const tenantId = session?.tenantId
  const [message, setMessage] = useState('')

  const ticketQuery = useMaintenanceTicket(tenantId, ticketId)
  const resolveMutation = useResolveMaintenanceTicket(tenantId, ticketId)
  const addNoteMutation = useAddMaintenanceTicketNote(tenantId, ticketId)

  const ticket = ticketQuery.data

  async function handleResolve() {
    try {
      await resolveMutation.mutateAsync()
      enqueueSnackbar(t('notifications.resolveSuccess'), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('notifications.resolveError')), { variant: 'error' })
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

  if (ticketQuery.isLoading) {
    return (
      <Box sx={{ width: '100%', p: 3.5 }}>
        <Typography sx={{ color: brand.neutral[500], fontSize: 14, fontWeight: 700 }}>
          {detailT('loading')}
        </Typography>
      </Box>
    )
  }

  if (!ticket) {
    return (
      <Box sx={{ width: '100%', p: 3.5 }}>
        <Stack spacing={2} alignItems="flex-start">
          <Typography sx={{ color: brand.graphite[500], fontSize: 24, fontWeight: 900 }}>
            {detailT('notFound.title')}
          </Typography>
          <Button component={Link} href="/dashboard/maintenance" variant="outlined">
            {detailT('notFound.action')}
          </Button>
        </Stack>
      </Box>
    )
  }

  const status = mapMaintenanceStatusFromApi(ticket.status)
  const priority = mapMaintenancePriorityFromApi(ticket.priority)
  const isResolved = ticket.status === 'RESOLVIDO' || ticket.status === 'FECHADO'
  const sortedActivities = [...ticket.activities].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  )

  return (
    <Box sx={{ width: '100%', p: 3.5 }}>
      <Stack spacing={2.2} sx={{ width: '100%' }}>
        <Box
          component={Link}
          href="/dashboard/maintenance"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.55,
            width: 'fit-content',
            color: brand.neutral[600],
            fontSize: 12,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <ArrowBackRoundedIcon sx={{ fontSize: 15 }} />
          {detailT('back')}
        </Box>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          justifyContent="space-between"
          spacing={1.5}
          alignItems={{ lg: 'center' }}
        >
          <Stack direction="row" flexWrap="wrap" alignItems="center" spacing={1.4} useFlexGap>
            <Typography
              sx={{ color: brand.graphite[500], fontSize: { xs: 21, md: 24 }, fontWeight: 900 }}
            >
              {ticket.id}
            </Typography>
            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: brand.neutral[500] }} />
            <Typography
              sx={{ color: brand.graphite[500], fontSize: { xs: 18, md: 20 }, fontWeight: 900 }}
            >
              {ticket.title}
            </Typography>
            <Chip
              label={t(`statuses.${status}`)}
              size="small"
              sx={{
                height: 21,
                ...statusStyles[status],
                fontSize: 10,
                fontWeight: 900,
              }}
            />
            <Stack direction="row" spacing={0.6} alignItems="center">
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: priorityColors[priority],
                }}
              />
              <Typography sx={{ fontSize: 11, fontWeight: 800 }}>
                {t(`priorities.${priority}`)}
              </Typography>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<PersonAddAltOutlinedIcon />}
              sx={secondaryButtonSx}
              disabled
            >
              {detailT('actions.assignProvider')}
            </Button>
            <Button
              variant="contained"
              startIcon={
                resolveMutation.isPending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <CheckRoundedIcon />
                )
              }
              sx={primaryButtonSx}
              onClick={handleResolve}
              disabled={isResolved || resolveMutation.isPending}
            >
              {detailT('actions.resolve')}
            </Button>
          </Stack>
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(300px, 1fr)' },
            gap: 2,
          }}
        >
          <Stack spacing={2}>
            <Box sx={cardSx}>
              <Typography sx={cardTitleSx}>{detailT('descriptionCard.title')}</Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                  gap: 1.5,
                  mt: 1.7,
                }}
              >
                {[
                  [t('columns.property'), ticket.propertyTitle],
                  [t('columns.category'), ticket.category],
                  [detailT('descriptionCard.openedBy'), ticket.openedByName],
                  [t('columns.openedAt'), formatDate(ticket.createdAt)],
                ].map(([label, value]) => (
                  <Box key={label}>
                    <Typography sx={labelSx}>{label}</Typography>
                    <Typography
                      sx={{ mt: 0.35, color: brand.graphite[500], fontSize: 12, fontWeight: 900 }}
                    >
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Divider sx={{ my: 1.8 }} />
              <Typography sx={labelSx}>{detailT('descriptionCard.report')}</Typography>
              <Typography
                sx={{ mt: 0.7, color: brand.neutral[600], fontSize: 13, lineHeight: 1.5 }}
              >
                {ticket.description}
              </Typography>
            </Box>
            <Box sx={cardSx}>
              <Typography sx={cardTitleSx}>{detailT('photos.title')}</Typography>
              {ticket.attachments.length > 0 ? (
                <Stack direction="row" spacing={1.4} flexWrap="wrap" useFlexGap sx={{ mt: 1.4 }}>
                  {ticket.attachments.map((attachment) => (
                    <Box
                      key={attachment.id}
                      sx={{
                        position: 'relative',
                        width: { xs: '50%', sm: 160 },
                        height: 105,
                        borderRadius: `${radius.sm}px`,
                        overflow: 'hidden',
                        backgroundImage: `url(${attachment.url})`,
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 'auto 0 0',
                          px: 0.8,
                          py: 0.35,
                          bgcolor: 'rgba(13,15,20,.62)',
                          color: surface.lightText,
                          fontSize: 10,
                        }}
                      >
                        {attachment.name}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography sx={{ mt: 1.4, color: brand.neutral[400], fontSize: 12 }}>
                  {detailT('photos.empty')}
                </Typography>
              )}
            </Box>
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
                          <Typography
                            sx={{ fontSize: 12, color: brand.graphite[500], fontWeight: 900 }}
                          >
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
                <Button
                  variant="outlined"
                  startIcon={<AttachFileRoundedIcon />}
                  sx={secondaryButtonSx}
                  disabled
                >
                  {detailT('actions.attachFiles')}
                </Button>
                <Button
                  variant="contained"
                  disabled={!message.trim() || addNoteMutation.isPending}
                  sx={primaryButtonSx}
                  onClick={handleSendMessage}
                >
                  {detailT('actions.sendMessage')}
                </Button>
              </Stack>
            </Box>
          </Stack>
          <Stack spacing={2}>
            <Box sx={cardSx}>
              <Typography sx={cardTitleSx}>{detailT('info.title')}</Typography>
              <Stack spacing={1.1} sx={{ mt: 1.6 }}>
                {[
                  [
                    t('columns.openedAt'),
                    detailT('info.dateTime', {
                      date: formatDate(ticket.createdAt),
                      time: formatDate(ticket.createdAt, 'HH:mm'),
                    }),
                  ],
                  [
                    detailT('info.lastUpdated'),
                    detailT('info.dateTime', {
                      date: formatDate(ticket.updatedAt),
                      time: formatDate(ticket.updatedAt, 'HH:mm'),
                    }),
                  ],
                ].map(([label, value]) => (
                  <Stack key={label} direction="row" justifyContent="space-between" spacing={1}>
                    <Typography sx={{ fontSize: 11, color: brand.neutral[500] }}>
                      {label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: brand.graphite[500],
                        fontWeight: 800,
                        textAlign: 'right',
                      }}
                    >
                      {value}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}

const cardTitleSx = { color: brand.graphite[500], fontSize: 15, fontWeight: 900 } as const
const secondaryButtonSx = {
  minHeight: 36,
  px: 1.6,
  borderColor: alpha.graphite[10],
  color: brand.neutral[600],
  fontSize: 11.5,
  fontWeight: 800,
  whiteSpace: 'nowrap',
} as const
const primaryButtonSx = {
  minHeight: 36,
  px: 1.7,
  fontSize: 11.5,
  fontWeight: 800,
  whiteSpace: 'nowrap',
} as const

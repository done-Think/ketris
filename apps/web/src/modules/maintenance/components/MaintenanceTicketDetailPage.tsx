'use client'

import { useState } from 'react'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded'
import CallOutlinedIcon from '@mui/icons-material/CallOutlined'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined'
import { Avatar, Box, Button, Chip, Divider, Stack, TextField, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import { getMaintenanceTicketDetail } from '../data/maintenance-ticket-detail'
import { getMaintenanceTickets } from '../data/maintenance-tickets'
import type { MaintenancePriority, MaintenanceStatus } from '../types/maintenance'

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

export function MaintenanceTicketDetailPage({ ticketId }: { ticketId: string }) {
  const t = useTranslations('dashboard.maintenance')
  const [message, setMessage] = useState('')
  const ticket = getMaintenanceTickets().find((currentTicket) => currentTicket.id === ticketId)

  if (!ticket) {
    return (
      <Box sx={{ width: '100%', px: { xs: 2, md: 3.6 }, py: { xs: 2.4, md: 3.2 } }}>
        <Stack spacing={2} alignItems="flex-start">
          <Typography sx={{ color: brand.graphite[500], fontSize: 24, fontWeight: 900 }}>
            Chamado não encontrado
          </Typography>
          <Button component={Link} href="/dashboard/maintenance" variant="outlined">
            Voltar para chamados
          </Button>
        </Stack>
      </Box>
    )
  }

  const detail = getMaintenanceTicketDetail(ticket)
  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 3.6 }, py: { xs: 2.4, md: 3.2 } }}>
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
          Voltar para chamados
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
              {detail.code}
            </Typography>
            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: brand.neutral[500] }} />
            <Typography
              sx={{ color: brand.graphite[500], fontSize: { xs: 18, md: 20 }, fontWeight: 900 }}
            >
              {detail.title}
            </Typography>
            <Chip
              label={t(`statuses.${detail.status}`)}
              size="small"
              sx={{
                height: 21,
                ...statusStyles[detail.status],
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
                  bgcolor: priorityColors[detail.priority],
                }}
              />
              <Typography sx={{ fontSize: 11, fontWeight: 800 }}>
                {t(`priorities.${detail.priority}`)}
              </Typography>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<PersonAddAltOutlinedIcon />}
              sx={secondaryButtonSx}
            >
              Atribuir prestador
            </Button>
            <Button variant="contained" startIcon={<CheckRoundedIcon />} sx={primaryButtonSx}>
              Marcar resolvido
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
              <Typography sx={cardTitleSx}>Descrição do Chamado</Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                  gap: 1.5,
                  mt: 1.7,
                }}
              >
                {[
                  ['Imóvel', detail.property],
                  ['Categoria', detail.category],
                  ['Aberto por', detail.openedBy],
                  ['Data de abertura', detail.openedAt],
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
              <Typography sx={labelSx}>Relato do problema</Typography>
              <Typography
                sx={{ mt: 0.7, color: brand.neutral[600], fontSize: 13, lineHeight: 1.5 }}
              >
                {detail.description}
              </Typography>
            </Box>
            <Box sx={cardSx}>
              <Typography sx={cardTitleSx}>Fotos Anexadas</Typography>
              <Stack direction="row" spacing={1.4} sx={{ mt: 1.4 }}>
                {detail.photos.map(({ name, src, position }) => (
                  <Box
                    key={name}
                    sx={{
                      position: 'relative',
                      width: { xs: '50%', sm: 160 },
                      height: 105,
                      borderRadius: `${radius.sm}px`,
                      overflow: 'hidden',
                      backgroundImage: `url(${src})`,
                      backgroundPosition: position === 'left' ? 'left center' : 'right center',
                      backgroundSize: '200% 100%',
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
                      {name}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
            <Box sx={cardSx}>
              <Typography sx={cardTitleSx}>Linha do Tempo e Atualizações</Typography>
              <Stack spacing={1.7} sx={{ mt: 1.7 }}>
                {detail.timeline.map((entry) => (
                  <Stack key={entry.timestamp} direction="row" spacing={1.2}>
                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,
                        bgcolor: brand.graphite[400],
                        fontSize: 11,
                        fontWeight: 900,
                      }}
                    >
                      {entry.name
                        .split(' ')
                        .map((part) => part[0])
                        .join('')
                        .slice(0, 2)}
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
                          {entry.name}
                        </Typography>
                        <Typography sx={{ fontSize: 10.5, color: brand.neutral[400] }}>
                          ({entry.role})
                        </Typography>
                        <Typography sx={{ fontSize: 10.5, color: brand.neutral[400] }}>
                          • {entry.timestamp}
                        </Typography>
                      </Stack>
                      <Typography
                        sx={{ mt: 0.45, color: brand.neutral[600], fontSize: 12, lineHeight: 1.5 }}
                      >
                        {entry.message}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
              <Divider sx={{ my: 1.7 }} />
              <TextField
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                multiline
                minRows={4}
                placeholder="Escreva uma mensagem ou atualização sobre o chamado..."
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
                >
                  Anexar arquivos
                </Button>
                <Button variant="contained" disabled={!message.trim()} sx={primaryButtonSx}>
                  Enviar Mensagem
                </Button>
              </Stack>
            </Box>
          </Stack>
          <Stack spacing={2}>
            <Box sx={cardSx}>
              <Typography sx={cardTitleSx}>Responsáveis</Typography>
              <Stack divider={<Divider flexItem />} sx={{ mt: 1 }}>
                {detail.responsibles.map((person) => (
                  <Stack
                    key={person.name}
                    direction="row"
                    alignItems="center"
                    spacing={1.1}
                    sx={{ py: 1 }}
                  >
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: brand.graphite[400],
                        fontSize: 11,
                        fontWeight: 900,
                      }}
                    >
                      {person.initials}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{ fontSize: 12, fontWeight: 900, color: brand.graphite[500] }}
                      >
                        {person.name}
                      </Typography>
                      <Typography sx={{ fontSize: 10.5, color: brand.neutral[400] }}>
                        {person.role}
                      </Typography>
                    </Box>
                    <CallOutlinedIcon
                      sx={{ ml: 'auto', color: brand.neutral[600], fontSize: 16 }}
                    />
                  </Stack>
                ))}
              </Stack>
            </Box>
            <Box sx={cardSx}>
              <Typography sx={cardTitleSx}>Informações Gerais</Typography>
              <Stack spacing={1.1} sx={{ mt: 1.6 }}>
                {[
                  [
                    'Data abertura',
                    detail.openedTime
                      ? `${detail.openedAt} às ${detail.openedTime}`
                      : detail.openedAt,
                  ],
                  ['Última atualização', detail.lastUpdated],
                  ['SLA estimado', detail.estimatedSla],
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

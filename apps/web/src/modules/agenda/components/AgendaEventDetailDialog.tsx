'use client'

import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import EventRepeatRoundedIcon from '@mui/icons-material/EventRepeatRounded'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Link as MuiLink,
  Stack,
  Typography,
} from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'
import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'

import { agendaRescheduleSchema } from '../schemas/agenda-reschedule-schema'
import type {
  AgendaEventDetailDialogProps,
  AgendaRescheduleFormValues,
} from '../types/agenda-event'

export function AgendaEventDetailDialog({
  event,
  eventDate,
  maxDate,
  minDate,
  onClose,
  onReschedule,
  open,
}: AgendaEventDetailDialogProps) {
  const { control, handleSubmit, reset } = useForm<AgendaRescheduleFormValues>({
    defaultValues: {
      scheduledDate: eventDate,
      scheduledTime: event?.time ?? '',
    },
    resolver: zodResolver(agendaRescheduleSchema),
  })

  useEffect(() => {
    reset({
      scheduledDate: eventDate,
      scheduledTime: event?.time ?? '',
    })
  }, [event?.time, eventDate, reset])

  if (!event) return null

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit(onReschedule)}>
        <DialogTitle sx={{ px: { xs: 2, md: 2.8 }, pb: 1.4, pt: 2.4 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: brand.magenta[600], fontSize: 13, fontWeight: 900 }}>
                {event.time} · {eventDate}
              </Typography>
              <Typography sx={{ color: brand.graphite[500], fontSize: 22, fontWeight: 900 }}>
                {event.title}
              </Typography>
            </Box>
            <IconButton aria-label="Fechar detalhes do evento" onClick={onClose}>
              <CloseRoundedIcon sx={{ fontSize: iconSize.lg }} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ px: { xs: 2, md: 2.8 }, pb: 2 }}>
          <Stack spacing={2}>
            <Box
              sx={{
                border: '1px solid',
                borderColor: alpha.graphite[8],
                borderRadius: `${radius.sm}px`,
                bgcolor: surface.app,
                p: 1.6,
              }}
            >
              <Stack spacing={1.3}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <HomeWorkOutlinedIcon sx={{ color: brand.magenta[500], fontSize: iconSize.md }} />
                  <MuiLink
                    component={Link}
                    href={event.propertyHref}
                    underline="hover"
                    sx={{ color: brand.graphite[500], fontSize: 15, fontWeight: 900 }}
                  >
                    {event.property}
                  </MuiLink>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PhoneOutlinedIcon sx={{ color: brand.neutral[500], fontSize: iconSize.md }} />
                  <Typography sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 800 }}>
                    {event.participant} · {event.phone}
                  </Typography>
                </Stack>
                {event.createdBy && event.createdByRole ? (
                  <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}>
                    Marcado por {event.createdByRole.toLocaleLowerCase('pt-BR')} {event.createdBy}
                  </Typography>
                ) : null}
              </Stack>
            </Box>

            <Box>
              <Typography
                sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 900, mb: 0.8 }}
              >
                Observações
              </Typography>
              <Typography sx={{ color: brand.neutral[500], fontSize: 14, lineHeight: 1.65 }}>
                {event.notes}
              </Typography>
            </Box>

            <Divider sx={{ borderColor: alpha.graphite[8] }} />

            <Stack spacing={1.4}>
              <Stack direction="row" spacing={1} alignItems="center">
                <EventRepeatRoundedIcon sx={{ color: brand.magenta[500], fontSize: iconSize.md }} />
                <Typography sx={{ color: brand.graphite[500], fontSize: 15, fontWeight: 900 }}>
                  Reagendar compromisso
                </Typography>
              </Stack>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 160px' },
                  gap: 1.4,
                }}
              >
                <RhfTextField
                  control={control}
                  name="scheduledDate"
                  label="Nova data"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ max: maxDate, min: minDate }}
                />
                <RhfTextField
                  control={control}
                  name="scheduledTime"
                  label="Novo horário"
                  type="time"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, md: 2.8 }, pb: 2.5, pt: 0 }}>
          <Button type="button" variant="outlined" color="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained">
            Salvar reagendamento
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

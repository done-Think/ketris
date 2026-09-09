'use client'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { Box, Button, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSnackbar } from 'notistack'

import { DashboardNotificationsButton } from '@shared/components/layout'
import { dashboardProperties } from '@modules/properties/data/dashboard-properties'
import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'

import { agendaEvents } from '../data/agenda-events'
import { agendaOtherPropertyValue } from '../schemas/agenda-reschedule-schema'
import type {
  AgendaEvent,
  AgendaEventFormValues,
  AgendaPropertyOption,
  AgendaRescheduleFormValues,
} from '../types/agenda-event'
import {
  agendaVisibleDayCount,
  buildAgendaCalendarDays,
  getAgendaNotifications,
  getAgendaWeekRange,
} from '../utils/agenda-calendar'
import type { DashboardNotificationItem } from '@shared/types/dashboard-notification'
import { AgendaEventDetailDialog } from './AgendaEventDetailDialog'
import { AgendaEventFormDialog } from './AgendaEventFormDialog'
import { AgendaTimeline } from './AgendaTimeline'

export function AgendaDashboardPage() {
  const { enqueueSnackbar } = useSnackbar()
  const searchParams = useSearchParams()
  const [events, setEvents] = useState<AgendaEvent[]>(agendaEvents)
  const [isEventFormOpen, setIsEventFormOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null)
  const today = useMemo(() => dayjs().locale('pt-br').startOf('day'), [])
  const currentMonthEnd = useMemo(() => today.endOf('month'), [today])
  const [weekStartDate, setWeekStartDate] = useState(() => today)
  const agendaDays = useMemo(() => buildAgendaCalendarDays(weekStartDate), [weekStartDate])
  const propertyOptions = useMemo<AgendaPropertyOption[]>(
    () =>
      dashboardProperties.map((property) => ({
        href: `/dashboard/properties/${property.id}`,
        id: property.id,
        label: `${property.title} - ${property.location}`,
      })),
    [],
  )
  const weekRange = getAgendaWeekRange(agendaDays)
  const notifications = useMemo(() => getAgendaNotifications(events, today), [events, today])
  const selectedEventDate = selectedEvent?.scheduledDate ?? ''
  const nextWeekStart = weekStartDate.add(agendaVisibleDayCount, 'day')
  const previousWeekStart = weekStartDate.subtract(agendaVisibleDayCount, 'day')
  const disablePreviousWeek = !previousWeekStart.isAfter(today.subtract(1, 'day'), 'day')
  const disableNextWeek = nextWeekStart.isAfter(currentMonthEnd, 'day')

  const closeEventDialog = () => setSelectedEvent(null)
  const showScheduledWeek = useCallback(
    (date: dayjs.Dayjs) => {
      if (date.isBefore(today, 'day')) {
        setWeekStartDate(today)
        return
      }

      const daysFromToday = date.startOf('day').diff(today, 'day')
      const weekOffset = Math.floor(daysFromToday / agendaVisibleDayCount) * agendaVisibleDayCount

      setWeekStartDate(today.add(weekOffset, 'day'))
    },
    [today],
  )

  const openNotificationEvent = (notification: DashboardNotificationItem) => {
    const event = events.find((agendaEvent) => agendaEvent.id === notification.metadata?.eventId)
    if (!event) return

    showScheduledWeek(dayjs(event.scheduledDate))
    setSelectedEvent(event)
  }

  useEffect(() => {
    const eventId = searchParams.get('eventId')
    const event = events.find((agendaEvent) => agendaEvent.id === eventId)
    if (!event) return

    showScheduledWeek(dayjs(event.scheduledDate))
    setSelectedEvent(event)
  }, [events, searchParams, showScheduledWeek])

  const rescheduleSelectedEvent = (values: AgendaRescheduleFormValues) => {
    if (!selectedEvent) return

    const nextDate = dayjs(values.scheduledDate)

    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.id === selectedEvent.id
          ? {
              ...event,
              scheduledDate: values.scheduledDate,
              time: values.scheduledTime,
              status: 'Confirmada',
            }
          : event,
      ),
    )
    showScheduledWeek(nextDate)
    enqueueSnackbar(
      `${selectedEvent.title} reagendado para ${nextDate.format('DD/MM/YYYY')} as ${
        values.scheduledTime
      }.`,
      { variant: 'success' },
    )
    closeEventDialog()
  }

  const createAgendaEvent = (values: AgendaEventFormValues) => {
    const scheduledDate = dayjs(values.scheduledDate)
    const selectedProperty = propertyOptions.find((property) => property.id === values.propertyId)
    const customProperty = values.customProperty.trim()
    const useCustomProperty = values.propertyId === agendaOtherPropertyValue
    const propertyLabel = useCustomProperty
      ? customProperty
      : (selectedProperty?.label ?? customProperty)
    const propertyHref = useCustomProperty
      ? '/dashboard/properties'
      : (selectedProperty?.href ?? '/dashboard/properties')
    const nextEvent: AgendaEvent = {
      id: `agenda-${Date.now()}`,
      scheduledDate: values.scheduledDate,
      time: values.scheduledTime,
      durationMinutes: values.durationMinutes,
      title: values.title,
      property: propertyLabel,
      propertyHref,
      participant: values.participant,
      phone: values.phone,
      notes: values.notes.trim() || 'Evento criado manualmente na agenda.',
      status: 'Confirmada',
      tone: 'primary',
    }

    setEvents((currentEvents) => [...currentEvents, nextEvent])
    showScheduledWeek(scheduledDate)
    setIsEventFormOpen(false)
    enqueueSnackbar(`${values.title} adicionado à agenda.`, { variant: 'success' })
  }

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 3.6 }, py: { xs: 2.4, md: 4.2 } }}>
      <Stack spacing={2.4}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography
              variant="h3"
              sx={{ color: brand.graphite[500], fontSize: { xs: 30, md: 40 }, fontWeight: 900 }}
            >
              Agenda
            </Typography>
            <Typography sx={{ color: brand.neutral[500], fontSize: { xs: 14, md: 15 } }}>
              Seus compromissos e tarefas organizados
            </Typography>
          </Box>

          <Stack direction="row" alignItems="center" spacing={1.2} sx={{ flexWrap: 'wrap' }}>
            <Tooltip title="Semana anterior">
              <IconButton
                aria-label="Semana anterior"
                disabled={disablePreviousWeek}
                onClick={() => setWeekStartDate(previousWeekStart)}
                sx={{
                  width: 36,
                  height: 36,
                  border: '1px solid',
                  borderColor: alpha.graphite[8],
                  bgcolor: surface.paper,
                }}
              >
                <ChevronLeftRoundedIcon sx={{ fontSize: iconSize.md }} />
              </IconButton>
            </Tooltip>
            <Typography sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 900 }}>
              Agenda de {weekRange.startLabel}-{weekRange.endLabel}
            </Typography>
            <Tooltip title="Próxima semana">
              <IconButton
                aria-label="Próxima semana"
                disabled={disableNextWeek}
                onClick={() => setWeekStartDate(nextWeekStart)}
                sx={{
                  width: 36,
                  height: 36,
                  border: '1px solid',
                  borderColor: alpha.graphite[8],
                  bgcolor: surface.paper,
                }}
              >
                <ChevronRightRoundedIcon sx={{ fontSize: iconSize.md }} />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon sx={{ fontSize: iconSize.sm }} />}
              onClick={() => setIsEventFormOpen(true)}
              sx={{ minHeight: 42, borderRadius: `${radius.sm}px`, fontWeight: 900 }}
            >
              Novo Evento
            </Button>
            <DashboardNotificationsButton
              notifications={notifications}
              onNotificationSelect={openNotificationEvent}
            />
          </Stack>
        </Stack>

        <AgendaTimeline days={agendaDays} events={events} onEventSelect={setSelectedEvent} />
      </Stack>

      <AgendaEventDetailDialog
        event={selectedEvent}
        eventDate={selectedEventDate}
        maxDate={currentMonthEnd.format('YYYY-MM-DD')}
        minDate={today.format('YYYY-MM-DD')}
        onClose={closeEventDialog}
        onReschedule={rescheduleSelectedEvent}
        open={Boolean(selectedEvent)}
      />

      <AgendaEventFormDialog
        maxDate={currentMonthEnd.format('YYYY-MM-DD')}
        minDate={today.format('YYYY-MM-DD')}
        onClose={() => setIsEventFormOpen(false)}
        onCreate={createAgendaEvent}
        open={isEventFormOpen}
        propertyOptions={propertyOptions}
      />
    </Box>
  )
}

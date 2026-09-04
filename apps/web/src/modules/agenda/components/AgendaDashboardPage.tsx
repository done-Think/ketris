'use client'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded'
import {
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { useMemo, useState } from 'react'
import { useSnackbar } from 'notistack'

import { dashboardProperties } from '@modules/properties/data/dashboard-properties'
import {
  alpha,
  brand,
  iconSize,
  radius,
  shadows,
  supportColor,
  surface,
} from '@shared/theme/tokens'

import { agendaEvents, agendaTimeSlots } from '../data/agenda-events'
import { agendaOtherPropertyValue } from '../schemas/agenda-reschedule-schema'
import type {
  AgendaCalendarDay,
  AgendaEvent,
  AgendaEventCardProps,
  AgendaEventFormValues,
  AgendaNotification,
  AgendaEventTone,
  AgendaEventToneStyle,
  AgendaPropertyOption,
  AgendaRescheduleFormValues,
  AgendaWeekRange,
} from '../types/agenda-event'
import { AgendaEventDetailDialog } from './AgendaEventDetailDialog'
import { AgendaEventFormDialog } from './AgendaEventFormDialog'

const scheduleStartHour = 8
const scheduleEndHour = 18
const scheduleHourHeight = 62
const scheduleTimelineHeight = (scheduleEndHour - scheduleStartHour + 1) * scheduleHourHeight
const agendaVisibleDayCount = 5

const agendaEventToneStyles: Record<AgendaEventTone, AgendaEventToneStyle> = {
  primary: {
    bgcolor: alpha.magenta[10],
    borderColor: brand.magenta[500],
    color: brand.magenta[600],
  },
  info: {
    bgcolor: supportColor.infoSoft,
    borderColor: brand.semantic.info,
    color: brand.semantic.info,
  },
  warning: {
    bgcolor: supportColor.warningSoft,
    borderColor: brand.semantic.warning,
    color: brand.semantic.warning,
  },
}

function getEventOffsetTop(time: string) {
  const [hour = scheduleStartHour, minute = 0] = time.split(':').map(Number)

  return (hour - scheduleStartHour) * scheduleHourHeight + (minute / 60) * scheduleHourHeight
}

function getEventHeight(durationMinutes: number) {
  return Math.max((durationMinutes / 60) * scheduleHourHeight, 38)
}

function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase('pt-BR') + value.slice(1)
}

function buildAgendaCalendarDays(weekStartDate: dayjs.Dayjs): AgendaCalendarDay[] {
  const today = dayjs().locale('pt-br').startOf('day')

  return Array.from({ length: agendaVisibleDayCount }, (_, index) => {
    const date = weekStartDate.add(index, 'day')

    return {
      dateLabel: date.format('DD'),
      dayLabel: capitalize(date.format('ddd').replace('.', '')),
      key: date.format('YYYY-MM-DD'),
      monthLabel: capitalize(date.format('MMM').replace('.', '')),
      today: date.isSame(today, 'day'),
    }
  })
}

function getAgendaWeekRange(days: AgendaCalendarDay[]): AgendaWeekRange {
  const [startDay] = days
  const endDay = days.at(-1) ?? startDay
  const sameMonth = startDay.monthLabel === endDay.monthLabel

  return {
    startLabel: sameMonth ? startDay.dateLabel : `${startDay.dateLabel} ${startDay.monthLabel}`,
    endLabel: `${endDay.dateLabel} ${endDay.monthLabel}`,
  }
}

function isVisitEvent(event: AgendaEvent) {
  return event.title.toLocaleLowerCase('pt-BR').includes('visita')
}

function getAgendaNotifications(events: AgendaEvent[], today: dayjs.Dayjs): AgendaNotification[] {
  return events.flatMap((event) => {
    const eventDate = dayjs(event.scheduledDate)
    const notifications: AgendaNotification[] = []

    if (eventDate.isSame(today, 'day') && isVisitEvent(event)) {
      notifications.push({
        event,
        id: `${event.id}-today-visit`,
        kind: 'todayVisit',
        message: `${event.time} - ${event.participant} em ${event.property}`,
        title: 'Visita marcada para hoje',
      })
    }

    if (event.createdBy && event.createdByRole) {
      notifications.push({
        event,
        id: `${event.id}-assigned`,
        kind: 'assignedEvent',
        message: `${event.createdByRole} ${event.createdBy} marcou ${event.title}`,
        title: 'Novo compromisso atribuído',
      })
    }

    return notifications
  })
}

function AgendaEventCard({ event, height, onSelect, top }: AgendaEventCardProps) {
  const tone = agendaEventToneStyles[event.tone]

  return (
    <Box
      component="button"
      type="button"
      aria-label={`Abrir ${event.title}`}
      onClick={() => onSelect(event)}
      sx={{
        position: 'absolute',
        top,
        left: { xs: 8, md: 16 },
        right: { xs: 8, md: 16 },
        minHeight: height,
        border: 0,
        borderLeft: '3px solid',
        borderColor: tone.borderColor,
        borderRadius: `${radius.sm}px`,
        bgcolor: tone.bgcolor,
        px: 1.1,
        py: 0.8,
        overflow: 'hidden',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'box-shadow 160ms ease, transform 160ms ease',
        '&:hover, &:focus-visible': {
          boxShadow: shadows.crmCardHover,
          transform: 'translateY(-1px)',
          outline: 'none',
        },
      }}
    >
      <Typography noWrap sx={{ color: tone.color, fontSize: 12, fontWeight: 900 }}>
        {event.time} - {event.title}
      </Typography>
      <Typography noWrap sx={{ color: brand.graphite[500], fontSize: 11, fontWeight: 700 }}>
        {event.participant} - {event.property}
      </Typography>
    </Box>
  )
}

export function AgendaDashboardPage() {
  const { enqueueSnackbar } = useSnackbar()
  const [events, setEvents] = useState<AgendaEvent[]>(agendaEvents)
  const [isEventFormOpen, setIsEventFormOpen] = useState(false)
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null)
  const today = useMemo(() => dayjs().locale('pt-br').startOf('day'), [])
  const currentMonthEnd = useMemo(() => today.endOf('month'), [today])
  const [weekStartDate, setWeekStartDate] = useState(() => today)
  const agendaDays = useMemo(() => buildAgendaCalendarDays(weekStartDate), [weekStartDate])
  const propertyOptions = useMemo<AgendaPropertyOption[]>(
    () =>
      dashboardProperties.map((property) => ({
        href: `/dashboard/imoveis/${property.id}`,
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
  const closeNotifications = () => setNotificationAnchorEl(null)
  const showScheduledWeek = (date: dayjs.Dayjs) => {
    if (date.isBefore(today, 'day')) {
      setWeekStartDate(today)
      return
    }

    const daysFromToday = date.startOf('day').diff(today, 'day')
    const weekOffset = Math.floor(daysFromToday / agendaVisibleDayCount) * agendaVisibleDayCount

    setWeekStartDate(today.add(weekOffset, 'day'))
  }

  const openNotificationEvent = (event: AgendaEvent) => {
    showScheduledWeek(dayjs(event.scheduledDate))
    setSelectedEvent(event)
    closeNotifications()
  }

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
      ? '/dashboard/imoveis'
      : (selectedProperty?.href ?? '/dashboard/imoveis')
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
            <Tooltip title="Notificações">
              <IconButton
                aria-label="Abrir notificações da agenda"
                aria-expanded={notificationAnchorEl ? 'true' : undefined}
                onClick={(event) => setNotificationAnchorEl(event.currentTarget)}
                sx={{
                  width: 42,
                  height: 42,
                  border: '1px solid',
                  borderColor: alpha.graphite[8],
                  bgcolor: surface.paper,
                  color: brand.graphite[500],
                }}
              >
                <Badge
                  badgeContent={notifications.length}
                  overlap="circular"
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: brand.magenta[500],
                      color: surface.lightText,
                      fontSize: 10,
                      fontWeight: 900,
                    },
                  }}
                >
                  <NotificationsNoneRoundedIcon sx={{ fontSize: iconSize.lg }} />
                </Badge>
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Box
          sx={{
            bgcolor: surface.paper,
            border: '1px solid',
            borderColor: alpha.graphite[6],
            borderRadius: `${radius.sm}px`,
            boxShadow: shadows.crmDetailPanel,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '48px repeat(5, minmax(132px, 1fr))',
                md: '72px repeat(5, minmax(0, 1fr))',
              },
              overflowX: 'auto',
            }}
          >
            <Box sx={{ minHeight: 78 }} />
            {agendaDays.map((day) => (
              <Stack
                key={day.key}
                alignItems="center"
                justifyContent="center"
                spacing={0.6}
                sx={{ minHeight: 78 }}
              >
                <Typography
                  sx={{
                    color: day.today ? brand.magenta[500] : brand.graphite[500],
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  {day.dayLabel} {day.dateLabel}
                </Typography>
                {day.today ? (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: radius.full,
                      bgcolor: brand.magenta[500],
                    }}
                  />
                ) : null}
              </Stack>
            ))}

            <Box
              sx={{
                position: 'relative',
                height: scheduleTimelineHeight,
                borderTop: '1px solid',
                borderColor: alpha.graphite[8],
              }}
            >
              {agendaTimeSlots.map((slot, index) => (
                <Typography
                  key={slot.label}
                  sx={{
                    position: 'absolute',
                    top: index * scheduleHourHeight + 14,
                    left: { xs: 8, md: 18 },
                    color: brand.neutral[500],
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {slot.label}
                </Typography>
              ))}
            </Box>

            {agendaDays.map((day) => (
              <Box
                key={`timeline-${day.key}`}
                sx={{
                  position: 'relative',
                  height: scheduleTimelineHeight,
                  borderTop: '1px solid',
                  borderLeft: '1px solid',
                  borderColor: alpha.graphite[8],
                  backgroundImage: `linear-gradient(${alpha.graphite[6]} 1px, ${surface.paper} 1px)`,
                  backgroundSize: `100% ${scheduleHourHeight}px`,
                }}
              >
                {events
                  .filter((event) => event.scheduledDate === day.key)
                  .map((event) => (
                    <AgendaEventCard
                      key={event.id}
                      event={event}
                      height={getEventHeight(event.durationMinutes)}
                      onSelect={setSelectedEvent}
                      top={getEventOffsetTop(event.time)}
                    />
                  ))}
              </Box>
            ))}
          </Box>
        </Box>
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

      <Popover
        open={Boolean(notificationAnchorEl)}
        anchorEl={notificationAnchorEl}
        onClose={closeNotifications}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: 312, sm: 360 },
              maxWidth: 'calc(100vw - 32px)',
              mt: 1,
              border: '1px solid',
              borderColor: alpha.graphite[8],
              borderRadius: `${radius.sm}px`,
              boxShadow: shadows.crmCardHover,
            },
          },
        }}
      >
        <Box sx={{ p: 1.6 }}>
          <Typography sx={{ color: brand.graphite[500], fontSize: 15, fontWeight: 900 }}>
            Alertas da agenda
          </Typography>
          <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}>
            Visitas de hoje e compromissos atribuídos
          </Typography>
        </Box>
        <Divider sx={{ borderColor: alpha.graphite[8] }} />
        <Stack sx={{ maxHeight: 360, overflowY: 'auto', p: 0.8 }}>
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const Icon =
                notification.kind === 'todayVisit'
                  ? EventAvailableRoundedIcon
                  : PersonAddAlt1RoundedIcon

              return (
                <Box
                  key={notification.id}
                  component="button"
                  type="button"
                  onClick={() => openNotificationEvent(notification.event)}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '32px 1fr',
                    gap: 1,
                    width: '100%',
                    border: 0,
                    borderRadius: `${radius.sm}px`,
                    bgcolor: surface.paper,
                    px: 1,
                    py: 1.1,
                    cursor: 'pointer',
                    textAlign: 'left',
                    '&:hover, &:focus-visible': {
                      bgcolor: alpha.magenta[6],
                      outline: 'none',
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      placeItems: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: radius.full,
                      bgcolor: alpha.magenta[10],
                      color: brand.magenta[600],
                    }}
                  >
                    <Icon sx={{ fontSize: iconSize.md }} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      noWrap
                      sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 900 }}
                    >
                      {notification.title}
                    </Typography>
                    <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}>
                      {notification.message}
                    </Typography>
                  </Box>
                </Box>
              )
            })
          ) : (
            <Box sx={{ px: 1, py: 2.2 }}>
              <Typography sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 700 }}>
                Nenhum alerta para exibir.
              </Typography>
            </Box>
          )}
        </Stack>
      </Popover>
    </Box>
  )
}

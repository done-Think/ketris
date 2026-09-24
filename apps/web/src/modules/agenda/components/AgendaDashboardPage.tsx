'use client'

import { Box, Stack } from '@mui/material'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { useSnackbar } from 'notistack'

import { useProperties } from '@modules/properties/hooks/use-properties'
import type { DashboardNotificationItem } from '@shared/types/dashboard-notification'

import { agendaTimeSlots } from '../data/agenda-events'
import {
  useAgendaEvents,
  useCancelAgendaEvent,
  useCreateAgendaEvent,
  useRescheduleAgendaEvent,
  useUpdateAgendaEvent,
} from '../hooks/use-agenda-events'
import { agendaOtherPropertyValue } from '../schemas/agenda-event-form-schema'
import type {
  AgendaEvent,
  AgendaEventApiKind,
  AgendaEventFormValues,
  AgendaPropertyOption,
} from '../types/agenda-event'
import { errorMessage } from '../utils/error-message'
import { toAgendaEvent } from '../utils/map-agenda-event'
import { AgendaDashboardHeader } from './agenda-dashboard/AgendaDashboardHeader'
import { AgendaWeekCalendar } from './agenda-dashboard/AgendaWeekCalendar'
import {
  agendaVisibleDayCount,
  buildAgendaCalendarDays,
  getAgendaNotifications,
  getAgendaWeekRange,
} from './agenda-dashboard/agenda-dashboard-shared'
import { AgendaEventDetailDialog } from './AgendaEventDetailDialog'
import { AgendaEventFormDialog } from './AgendaEventFormDialog'

export function AgendaDashboardPage() {
  const t = useTranslations('agenda.dashboard')
  const { enqueueSnackbar } = useSnackbar()
  const { data: session } = useSession()
  const tenantId = session?.tenantId ?? ''
  const [isEventFormOpen, setIsEventFormOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null)
  const today = useMemo(() => dayjs().locale('pt-br').startOf('day'), [])
  const scheduleHorizonEnd = useMemo(() => today.add(6, 'month').endOf('month'), [today])
  const [weekStartDate, setWeekStartDate] = useState(() => today)
  const agendaDays = useMemo(() => buildAgendaCalendarDays(weekStartDate), [weekStartDate])

  const propertiesQuery = useProperties()
  const propertyOptions = useMemo<AgendaPropertyOption[]>(
    () =>
      (propertiesQuery.data ?? []).map((property) => ({
        href: `/dashboard/properties/${property.id}`,
        id: property.id,
        label: property.address
          ? `${property.title} - ${property.address.neighborhood}, ${property.address.city}`
          : property.title,
      })),
    [propertiesQuery.data],
  )
  const propertiesById = useMemo<Record<string, AgendaPropertyOption>>(
    () => Object.fromEntries(propertyOptions.map((option) => [option.id, option])),
    [propertyOptions],
  )

  const eventsQuery = useAgendaEvents(
    tenantId,
    today.toISOString(),
    scheduleHorizonEnd.toISOString(),
  )
  const events = useMemo(
    () =>
      (eventsQuery.data ?? [])
        .filter((event) => event.status !== 'CANCELLED')
        .map((event) => toAgendaEvent(event, propertiesById)),
    [eventsQuery.data, propertiesById],
  )
  const createAgendaEventMutation = useCreateAgendaEvent(tenantId)
  const updateAgendaEventMutation = useUpdateAgendaEvent(tenantId)
  const rescheduleAgendaEventMutation = useRescheduleAgendaEvent(tenantId)
  const cancelAgendaEventMutation = useCancelAgendaEvent(tenantId)

  const weekRange = getAgendaWeekRange(agendaDays)
  const notifications = useMemo(
    () => getAgendaNotifications({ events, t, today }),
    [events, t, today],
  )
  const nextWeekStart = weekStartDate.add(agendaVisibleDayCount, 'day')
  const previousWeekStart = weekStartDate.subtract(agendaVisibleDayCount, 'day')
  const disablePreviousWeek = !previousWeekStart.isAfter(today.subtract(1, 'day'), 'day')
  const disableNextWeek = nextWeekStart.isAfter(scheduleHorizonEnd, 'day')

  const closeEventDialog = () => setSelectedEvent(null)
  const showScheduledWeek = (date: dayjs.Dayjs) => {
    if (date.isBefore(today, 'day')) {
      setWeekStartDate(today)
      return
    }

    const daysFromToday = date.startOf('day').diff(today, 'day')
    const weekOffset = Math.floor(daysFromToday / agendaVisibleDayCount) * agendaVisibleDayCount

    setWeekStartDate(today.add(weekOffset, 'day'))
  }

  const openNotificationEvent = (notification: DashboardNotificationItem) => {
    const event = events.find((agendaEvent) => agendaEvent.id === notification.href?.query?.eventId)
    if (!event) return

    showScheduledWeek(dayjs(event.scheduledDate))
    setSelectedEvent(event)
  }

  const createAgendaEvent = async (values: AgendaEventFormValues) => {
    const scheduledDate = dayjs(values.scheduledDate)
    const start = dayjs(`${values.scheduledDate}T${values.scheduledTime}`)
    const useCustomProperty = values.propertyId === agendaOtherPropertyValue
    const customProperty = values.customProperty.trim()

    try {
      await createAgendaEventMutation.mutateAsync({
        title: values.title,
        kind: values.kind ? (values.kind as AgendaEventApiKind) : undefined,
        ...(useCustomProperty
          ? { propertyReference: customProperty }
          : { propertyId: values.propertyId }),
        start: start.toISOString(),
        durationMinutes: values.durationMinutes,
        participantName: values.participant,
        participantPhone: values.phone,
        notes: values.notes.trim() || t('defaultEventNotes'),
      })
      showScheduledWeek(scheduledDate)
      setIsEventFormOpen(false)
      enqueueSnackbar(t('createSuccess', { title: values.title }), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('createError')), { variant: 'error' })
    }
  }

  const editAgendaEvent = async (values: AgendaEventFormValues): Promise<boolean> => {
    if (!selectedEvent) return false

    const scheduledDate = dayjs(values.scheduledDate)
    const start = dayjs(`${values.scheduledDate}T${values.scheduledTime}`)
    const useCustomProperty = values.propertyId === agendaOtherPropertyValue
    const customProperty = values.customProperty.trim()

    try {
      await rescheduleAgendaEventMutation.mutateAsync({
        id: selectedEvent.id,
        payload: { start: start.toISOString(), durationMinutes: values.durationMinutes },
      })
      const updated = await updateAgendaEventMutation.mutateAsync({
        id: selectedEvent.id,
        payload: {
          title: values.title,
          kind: values.kind ? (values.kind as AgendaEventApiKind) : null,
          ...(useCustomProperty
            ? { propertyId: null, propertyReference: customProperty }
            : { propertyId: values.propertyId, propertyReference: null }),
          participantName: values.participant,
          participantPhone: values.phone,
          notes: values.notes.trim() || null,
        },
      })
      setSelectedEvent(toAgendaEvent(updated, propertiesById))
      showScheduledWeek(scheduledDate)
      enqueueSnackbar(t('editSuccess', { title: values.title }), { variant: 'success' })
      return true
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('editError')), { variant: 'error' })
      return false
    }
  }

  const deleteSelectedEvent = async (): Promise<boolean> => {
    if (!selectedEvent) return false

    try {
      await cancelAgendaEventMutation.mutateAsync(selectedEvent.id)
      enqueueSnackbar(t('deleteSuccess', { title: selectedEvent.title }), { variant: 'success' })
      return true
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('deleteError')), { variant: 'error' })
      return false
    }
  }

  return (
    <Box sx={{ width: '100%', p: 3.5 }}>
      <Stack spacing={2.4}>
        <AgendaDashboardHeader
          disableNextWeek={disableNextWeek}
          disablePreviousWeek={disablePreviousWeek}
          notifications={notifications}
          onNewEvent={() => setIsEventFormOpen(true)}
          onNextWeek={() => setWeekStartDate(nextWeekStart)}
          onNotificationSelect={openNotificationEvent}
          onPreviousWeek={() => setWeekStartDate(previousWeekStart)}
          weekRange={weekRange}
        />

        <AgendaWeekCalendar
          days={agendaDays}
          events={events}
          onSelectEvent={setSelectedEvent}
          timeSlots={agendaTimeSlots}
        />
      </Stack>

      <AgendaEventDetailDialog
        event={selectedEvent}
        isDeleting={cancelAgendaEventMutation.isPending}
        isSaving={updateAgendaEventMutation.isPending || rescheduleAgendaEventMutation.isPending}
        maxDate={scheduleHorizonEnd.format('YYYY-MM-DD')}
        minDate={today.format('YYYY-MM-DD')}
        onClose={closeEventDialog}
        onDelete={deleteSelectedEvent}
        onEdit={editAgendaEvent}
        open={Boolean(selectedEvent)}
        propertyOptions={propertyOptions}
      />

      <AgendaEventFormDialog
        maxDate={scheduleHorizonEnd.format('YYYY-MM-DD')}
        minDate={today.format('YYYY-MM-DD')}
        onClose={() => setIsEventFormOpen(false)}
        onCreate={createAgendaEvent}
        open={isEventFormOpen}
        propertyOptions={propertyOptions}
      />
    </Box>
  )
}

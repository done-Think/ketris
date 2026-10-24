'use client'

import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import 'dayjs/locale/pt-br'
import { useSession } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { useSnackbar } from 'notistack'

import { useProperties } from '@modules/properties/hooks/use-properties'
import { getRestrictedRoleAccess } from '@shared/lib/auth/restricted-role-access'
import type { DashboardNotificationItem } from '@shared/types/dashboard-notification'

import { agendaTimeSlots } from '../data/agenda-events'
import {
  useAgendaEvents,
  useCancelAgendaEvent,
  useCreateAgendaEvent,
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
import { toAgendaEvent, toAgendaAudiencePayload } from '../utils/map-agenda-event'
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
import { useAgendaOrganization } from '../hooks/use-agenda-organization'
import { useAgendaAgents } from '../hooks/use-agenda-agents'
import { mapAgendaOrganization } from '../utils/map-agenda-organization'

export function AgendaDashboardPage() {
  const t = useTranslations('agenda.dashboard')
  const organizationT = useTranslations('agenda.organization')
  const locale = useLocale()
  const { enqueueSnackbar } = useSnackbar()
  const { data: session } = useSession()
  const tenantId = session?.tenantId ?? ''
  const isRenter = session?.role === 'RENTER'
  const restrictedAccess = getRestrictedRoleAccess(session?.role)
  const isReadOnlyViewer = Boolean(restrictedAccess) && !restrictedAccess?.canManageAgenda
  const hasOrganization = isRenter || session?.role === 'OWNER'
  const [isEventFormOpen, setIsEventFormOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null)
  const agentsQuery = useAgendaAgents(
    !restrictedAccess && (isEventFormOpen || Boolean(selectedEvent)),
  )
  const audienceFormProps = {
    canManageAudience: session?.role === 'OWNER',
    agentOptions: agentsQuery.data,
    agentsLoading: agentsQuery.isLoading,
    agentsError: agentsQuery.isError,
  }
  const isOwnEvent =
    Boolean(selectedEvent) &&
    Boolean(session?.user?.id) &&
    (selectedEvent?.responsibleId === session?.user?.id ||
      selectedEvent?.createdById === session?.user?.id)
  const selectedEventReadOnly =
    isReadOnlyViewer ||
    (Boolean(restrictedAccess) && !isOwnEvent) ||
    (session?.role !== 'OWNER' &&
      Boolean(selectedEvent) &&
      (selectedEvent?.internal ||
        selectedEvent?.audience === 'ALL_AGENTS' ||
        (selectedEvent?.audience === 'ASSIGNED_AGENT' &&
          (session?.role !== 'AGENT' || selectedEvent.responsibleId !== session?.user?.id))))
  const today = useMemo(() => dayjs().startOf('day'), [])
  const scheduleHorizonEnd = useMemo(() => today.add(6, 'month').endOf('month'), [today])
  const scheduleStart = isRenter ? today.subtract(6, 'month') : today
  const [weekStartDate, setWeekStartDate] = useState(() => today)
  const agendaDays = useMemo(
    () => buildAgendaCalendarDays(weekStartDate, locale),
    [locale, weekStartDate],
  )

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
    scheduleStart.toISOString(),
    scheduleHorizonEnd.toISOString(),
  )
  const events = useMemo(
    () =>
      (eventsQuery.data ?? [])
        .filter((event) => event.status !== 'CANCELLED')
        .map((event) => toAgendaEvent(event, propertiesById)),
    [eventsQuery.data, propertiesById],
  )
  const { charges, maintenance } = useAgendaOrganization()
  const organizationItems = useMemo(
    () => mapAgendaOrganization(isRenter ? (charges.data ?? []) : [], maintenance.data ?? []),
    [charges.data, maintenance.data, isRenter],
  )
  const createAgendaEventMutation = useCreateAgendaEvent(tenantId)
  const updateAgendaEventMutation = useUpdateAgendaEvent(tenantId)
  const cancelAgendaEventMutation = useCancelAgendaEvent(tenantId)

  const weekRange = getAgendaWeekRange(agendaDays)
  const notifications = useMemo(
    () => getAgendaNotifications({ events, t, today }),
    [events, t, today],
  )
  const nextWeekStart = weekStartDate.add(agendaVisibleDayCount, 'day')
  const previousWeekStart = weekStartDate.subtract(agendaVisibleDayCount, 'day')
  const disablePreviousWeek = !previousWeekStart.isAfter(scheduleStart.subtract(1, 'day'), 'day')
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
    if (isReadOnlyViewer) return
    const scheduledDate = dayjs(values.scheduledDate)
    const start = dayjs(`${values.scheduledDate}T${values.scheduledTime}`)
    const useCustomProperty = values.propertyId === agendaOtherPropertyValue
    const customProperty = values.customProperty.trim()

    try {
      await createAgendaEventMutation.mutateAsync({
        ...toAgendaAudiencePayload(values),
        title: values.title,
        kind: values.kind ? (values.kind as AgendaEventApiKind) : undefined,
        ...(useCustomProperty
          ? { propertyReference: customProperty }
          : values.propertyId
            ? { propertyId: values.propertyId }
            : {}),
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
    if (!selectedEvent || selectedEventReadOnly) return false

    const scheduledDate = dayjs(values.scheduledDate)
    const start = dayjs(`${values.scheduledDate}T${values.scheduledTime}`)
    const useCustomProperty = values.propertyId === agendaOtherPropertyValue
    const customProperty = values.customProperty.trim()

    try {
      const updated = await updateAgendaEventMutation.mutateAsync({
        id: selectedEvent.id,
        payload: {
          start: start.toISOString(),
          durationMinutes: values.durationMinutes,
          ...toAgendaAudiencePayload(values),
          title: values.title,
          kind: values.kind ? (values.kind as AgendaEventApiKind) : null,
          ...(useCustomProperty
            ? { propertyId: null, propertyReference: customProperty }
            : { propertyId: values.propertyId || null, propertyReference: null }),
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
    if (!selectedEvent || selectedEventReadOnly) return false

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
          readOnly={isReadOnlyViewer}
          disableNextWeek={disableNextWeek}
          disablePreviousWeek={disablePreviousWeek}
          notifications={notifications}
          onNewEvent={() => setIsEventFormOpen(true)}
          onNextWeek={() => setWeekStartDate(nextWeekStart)}
          onNotificationSelect={openNotificationEvent}
          onPreviousWeek={() => setWeekStartDate(previousWeekStart)}
          weekRange={weekRange}
        />

        {hasOrganization ? (
          <>
            {(eventsQuery.isLoading ||
              (isRenter && charges.isLoading) ||
              maintenance.isLoading) && <CircularProgress aria-label={t('loading')} size={24} />}
            {eventsQuery.isError && <Typography role="alert">{t('loadError')}</Typography>}
            {isRenter && charges.isError && (
              <Typography role="alert">
                {organizationT('sourceError', { source: organizationT('charges') })}
              </Typography>
            )}
            {maintenance.isError && (
              <Typography role="alert">
                {organizationT('sourceError', { source: organizationT('maintenance') })}
              </Typography>
            )}
            {isRenter &&
              !eventsQuery.isLoading &&
              !charges.isLoading &&
              !maintenance.isLoading &&
              !eventsQuery.isError &&
              !charges.isError &&
              !maintenance.isError &&
              events.length === 0 &&
              organizationItems.length === 0 && <Typography>{t('empty')}</Typography>}
          </>
        ) : eventsQuery.isLoading ? (
          <Stack alignItems="center" sx={{ p: 4 }}>
            <CircularProgress aria-label={t('loading')} />
          </Stack>
        ) : eventsQuery.isError ? (
          <Typography role="alert">{t('loadError')}</Typography>
        ) : null}
        {(hasOrganization || (!eventsQuery.isLoading && !eventsQuery.isError)) && (
          <AgendaWeekCalendar
            days={agendaDays}
            events={events}
            organizationItems={hasOrganization ? organizationItems : undefined}
            onSelectEvent={setSelectedEvent}
            timeSlots={agendaTimeSlots}
          />
        )}
      </Stack>

      <AgendaEventDetailDialog
        {...audienceFormProps}
        readOnly={selectedEventReadOnly}
        hidePrivateDetails={isRenter}
        event={
          isRenter
            ? (events.find((event) => event.id === selectedEvent?.id) ?? null)
            : selectedEvent
        }
        isDeleting={cancelAgendaEventMutation.isPending}
        isSaving={updateAgendaEventMutation.isPending}
        maxDate={scheduleHorizonEnd.format('YYYY-MM-DD')}
        minDate={today.format('YYYY-MM-DD')}
        onClose={closeEventDialog}
        onDelete={deleteSelectedEvent}
        onEdit={editAgendaEvent}
        open={Boolean(selectedEvent)}
        propertyOptions={propertyOptions}
      />

      {!isReadOnlyViewer && (
        <AgendaEventFormDialog
          {...audienceFormProps}
          maxDate={scheduleHorizonEnd.format('YYYY-MM-DD')}
          minDate={today.format('YYYY-MM-DD')}
          onClose={() => setIsEventFormOpen(false)}
          onCreate={createAgendaEvent}
          open={isEventFormOpen}
          propertyOptions={propertyOptions}
        />
      )}
    </Box>
  )
}

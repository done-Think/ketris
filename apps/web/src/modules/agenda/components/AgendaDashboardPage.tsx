'use client'

import { useAgendaCalendarNavigation } from '../hooks/use-agenda-calendar-navigation'
import { useAgendaEventActions } from '../hooks/use-agenda-event-actions'

import { styles } from '../styles/agenda-dashboard-page.styles'

import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useSession } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import { getRestrictedRoleAccess } from '@shared/lib/auth/restricted-role-access'
import type { DashboardNotificationItem } from '@shared/types/dashboard-notification'

import { agendaTimeSlots } from '../config/agenda-scheduling'
import { useAgendaEvents } from '../hooks/use-agenda-events'
import type { AgendaEvent, AgendaPropertyOption } from '../types/agenda-event'
import { toAgendaEvent } from '../utils/map-agenda-event'
import { AgendaDashboardHeader } from './agenda-dashboard/AgendaDashboardHeader'
import { AgendaWeekCalendar } from './agenda-dashboard/AgendaWeekCalendar'
import { getAgendaNotifications } from '../utils/agenda-calendar'
import { AgendaEventDetailDialog } from './AgendaEventDetailDialog'
import { AgendaEventFormDialog } from './AgendaEventFormDialog'
import { useAgendaOrganization } from '../hooks/use-agenda-organization'
import { useAgendaAgents } from '../hooks/use-agenda-agents'
import { canEditAgendaEvent } from '../utils/can-edit-agenda-event'
import { mapAgendaOrganization } from '../utils/map-agenda-organization'

export function AgendaDashboardPage() {
  const t = useTranslations('agenda.dashboard')
  const organizationT = useTranslations('agenda.organization')
  const locale = useLocale()
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
  const selectedEventReadOnly = !canEditAgendaEvent(
    { role: session?.role, userId: session?.user?.id },
    selectedEvent,
  )
  const {
    today,
    horizonEnd: scheduleHorizonEnd,
    start: scheduleStart,
    days: agendaDays,
    weekRange,
    showScheduledWeek,
    disablePreviousWeek,
    disableNextWeek,
    onPreviousWeek,
    onNextWeek,
  } = useAgendaCalendarNavigation(isRenter, locale)

  const eventsQuery = useAgendaEvents(
    tenantId,
    scheduleStart.toISOString(),
    scheduleHorizonEnd.toISOString(),
  )
  const propertyOptions = useMemo<AgendaPropertyOption[]>(
    () =>
      (eventsQuery.data ?? []).flatMap((event) =>
        event.propertyId && event.propertyLabel
          ? [
              {
                id: event.propertyId,
                label: event.propertyLabel,
                href: { pathname: '/dashboard/properties/[id]', params: { id: event.propertyId } },
              },
            ]
          : [],
      ),
    [eventsQuery.data],
  )
  const propertiesById = useMemo(
    () => Object.fromEntries(propertyOptions.map((option) => [option.id, option])),
    [propertyOptions],
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

  const notifications = useMemo(
    () => getAgendaNotifications({ events, currentUserId: session?.user?.id, t, today }),
    [events, session?.user?.id, t, today],
  )
  const closeEventDialog = () => setSelectedEvent(null)

  const openNotificationEvent = (notification: DashboardNotificationItem) => {
    const event = events.find((agendaEvent) => agendaEvent.id === notification.href?.query?.eventId)
    if (!event) return

    showScheduledWeek(dayjs(event.scheduledDate))
    setSelectedEvent(event)
  }

  const { createAgendaEvent, editAgendaEvent, deleteSelectedEvent, isDeleting, isSaving } =
    useAgendaEventActions({
      tenantId,
      selectedEvent,
      readOnly: isReadOnlyViewer,
      selectedEventReadOnly,
      propertiesById,
      onCreated: (date) => {
        showScheduledWeek(dayjs(date))
        setIsEventFormOpen(false)
      },
      onUpdated: (event, date) => {
        setSelectedEvent(event)
        showScheduledWeek(dayjs(date))
      },
    })

  return (
    <Box sx={styles.box}>
      <Stack spacing={2.4}>
        <AgendaDashboardHeader
          readOnly={isReadOnlyViewer}
          disableNextWeek={disableNextWeek}
          disablePreviousWeek={disablePreviousWeek}
          notifications={notifications}
          onNewEvent={() => setIsEventFormOpen(true)}
          onNextWeek={onNextWeek}
          onNotificationSelect={openNotificationEvent}
          onPreviousWeek={onPreviousWeek}
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
          <Stack alignItems="center" sx={styles.stack}>
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
        isDeleting={isDeleting}
        isSaving={isSaving}
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

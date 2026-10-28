'use client'

import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useMemo } from 'react'

import { AgendaEventFormDialog } from '@modules/agenda/components/AgendaEventFormDialog'
import { useCreateAgendaEvent } from '@modules/agenda/hooks/use-agenda-events'
import { agendaOtherPropertyValue } from '@modules/agenda/schemas/agenda-event-form-schema'
import type { AgendaEventFormValues } from '@modules/agenda/types/agenda-event'
import { BrokerTeamDashboardPage } from '@modules/team'
import type { TeamMeetingDialogProps } from '@modules/team/types/team'
import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'

function MeetingDialog({ member, onClose }: TeamMeetingDialogProps) {
  const t = useTranslations('dashboard.team')
  const { enqueueSnackbar } = useSnackbar()
  const scope = useTenantSessionScope()
  const createEvent = useCreateAgendaEvent(scope.tenantId)
  const today = dayjs().startOf('day')
  const initialValues = useMemo<Partial<AgendaEventFormValues>>(
    () => ({
      title: t('dialogs.oneOnOneTitle', { name: member.name }),
      participant: member.name,
      phone: member.phone ?? '',
      kind: 'MEETING',
      propertyId: agendaOtherPropertyValue,
      customProperty: t('dialogs.internalMeeting'),
    }),
    [member, t],
  )

  const schedule = async (values: AgendaEventFormValues) => {
    try {
      await createEvent.mutateAsync({
        title: values.title,
        kind: values.kind || undefined,
        ...(values.propertyId === agendaOtherPropertyValue
          ? { propertyReference: values.customProperty.trim() }
          : { propertyId: values.propertyId }),
        start: dayjs(`${values.scheduledDate}T${values.scheduledTime}`).toISOString(),
        durationMinutes: values.durationMinutes,
        participantName: values.participant,
        participantPhone: values.phone,
        notes: values.notes.trim(),
      })
      onClose()
      enqueueSnackbar(t('dialogs.scheduled'), { variant: 'success' })
    } catch {
      enqueueSnackbar(t('dialogs.scheduleError'), { variant: 'error' })
    }
  }

  return (
    <AgendaEventFormDialog
      open
      onClose={onClose}
      onCreate={schedule}
      initialValues={initialValues}
      minDate={today.format('YYYY-MM-DD')}
      maxDate={today.add(6, 'month').endOf('month').format('YYYY-MM-DD')}
      propertyOptions={[]}
    />
  )
}

export function TeamDashboardComposition() {
  return <BrokerTeamDashboardPage renderMeetingDialog={(props) => <MeetingDialog {...props} />} />
}

import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { extractErrorMessage } from '@shared/utils/error-message'
import { agendaErrorKeys } from '../config/agenda-error-keys'
import {
  useCancelAgendaEvent,
  useCreateAgendaEvent,
  useUpdateAgendaEvent,
} from './use-agenda-events'
import type { AgendaEventFormValues } from '../types/agenda-event'
import type { AgendaEventActionsOptions } from '../types/event-actions'
import { toCreateAgendaPayload, toUpdateAgendaPayload } from '../utils/to-agenda-payload'
import { toAgendaEvent } from '../utils/map-agenda-event'

export function useAgendaEventActions({
  tenantId,
  selectedEvent,
  readOnly,
  selectedEventReadOnly,
  propertiesById,
  onCreated,
  onUpdated,
}: AgendaEventActionsOptions) {
  const t = useTranslations('agenda.dashboard')
  const errorT = useTranslations('agenda.errors')
  const { enqueueSnackbar } = useSnackbar()
  const createMutation = useCreateAgendaEvent(tenantId)
  const updateMutation = useUpdateAgendaEvent(tenantId)
  const cancelMutation = useCancelAgendaEvent(tenantId)
  const messages = Object.fromEntries(
    Object.entries(agendaErrorKeys).map(([code, key]) => [code, errorT(key)]),
  )

  async function createAgendaEvent(values: AgendaEventFormValues) {
    if (readOnly) return
    try {
      await createMutation.mutateAsync(toCreateAgendaPayload(values, t('defaultEventNotes')))
      onCreated(values.scheduledDate)
      enqueueSnackbar(t('createSuccess', { title: values.title }), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error, t('createError'), messages), { variant: 'error' })
    }
  }
  async function editAgendaEvent(values: AgendaEventFormValues): Promise<boolean> {
    if (!selectedEvent || selectedEventReadOnly) return false
    try {
      const updated = await updateMutation.mutateAsync({
        id: selectedEvent.id,
        payload: toUpdateAgendaPayload(values),
      })
      onUpdated(toAgendaEvent(updated, propertiesById), values.scheduledDate)
      enqueueSnackbar(t('editSuccess', { title: values.title }), { variant: 'success' })
      return true
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error, t('editError'), messages), { variant: 'error' })
      return false
    }
  }
  async function deleteSelectedEvent(reason: string): Promise<boolean> {
    if (!selectedEvent || selectedEventReadOnly) return false
    try {
      await cancelMutation.mutateAsync({ id: selectedEvent.id, payload: { reason } })
      enqueueSnackbar(t('deleteSuccess', { title: selectedEvent.title }), { variant: 'success' })
      return true
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error, t('deleteError'), messages), { variant: 'error' })
      return false
    }
  }
  return {
    createAgendaEvent,
    editAgendaEvent,
    deleteSelectedEvent,
    isDeleting: cancelMutation.isPending,
    isSaving: updateMutation.isPending,
  }
}

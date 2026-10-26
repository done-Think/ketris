import en from '@/i18n/messages/en-US/dashboard.json'
import es from '@/i18n/messages/es-ES/dashboard.json'
import pt from '@/i18n/messages/pt-BR/dashboard.json'
import { createTranslator } from 'next-intl'
import { describe, expect, it } from 'vitest'
import type { ApiMaintenanceActivity } from '../../types/service'
import { formatMaintenanceActivity } from '../../utils/maintenance-activity'
import {
  buildCreateMaintenanceTicketPayload,
  buildMaintenanceScheduleAction,
  mapMaintenanceScheduleToFormValues,
  mapMaintenanceTicketListItemFromApi,
} from '../../utils/maintenance-adapter'
import { formatMaintenanceCategory } from '../../utils/maintenance-category'

describe('Maintenance adapters and locale presentation', () => {
  it('sends only the selected contract, retaining the actual category and values', () => {
    expect(
      buildCreateMaintenanceTicketPayload({
        contractId: 'contract',
        propertyId: 'redundant',
        title: 'Title',
        description: 'Description',
        category: 'Categoria antiga',
        priority: 'urgent',
      }),
    ).toEqual({
      contractId: 'contract',
      title: 'Title',
      description: 'Description',
      category: 'Categoria antiga',
      priority: 'URGENTE',
    })
  })
  it('uses the injected locale formatter for list dates', () => {
    const item = mapMaintenanceTicketListItemFromApi(
      {
        id: 'ticket',
        title: 'Title',
        propertyId: 'property',
        propertyTitle: 'Property',
        category: 'PLUMBING',
        priority: 'URGENTE',
        status: 'ABERTO',
        openedByName: 'Renter',
        resolvedAt: null,
        createdAt: '2026-10-26T12:00:00Z',
        updatedAt: '2026-10-26T12:00:00Z',
      },
      () => 'Oct 26, 2026',
    )
    expect(item).toMatchObject({ openedAt: 'Oct 26, 2026', priority: 'urgent', status: 'open' })
  })
  it('round trips local scheduling across timezones without changing the instant', () => {
    const scheduledAt = new Date(2026, 9, 26, 14, 35).toISOString()
    expect(
      buildMaintenanceScheduleAction(mapMaintenanceScheduleToFormValues({ scheduledAt })),
    ).toEqual({ action: 'schedule', scheduledAt })
  })
  it.each([
    ['pt-BR', pt, 'Hidráulica'],
    ['en-US', en, 'Plumbing'],
    ['es-ES', es, 'Fontanería'],
  ] as const)(
    'translates coded categories and system events in %s while retaining human text',
    (locale, messages, label) => {
      const translate = createTranslator({
        locale,
        messages: { dashboard: messages },
        namespace: 'dashboard.maintenance',
      })
      const t = (key: string, values?: Record<string, string>) =>
        translate(key as Parameters<typeof translate>[0], values)
      expect(formatMaintenanceCategory('PLUMBING', (key) => t(`categories.${key}`))).toBe(label)
      expect(formatMaintenanceCategory('Categoria antiga', (key) => t(`categories.${key}`))).toBe(
        'Categoria antiga',
      )
      const event: ApiMaintenanceActivity = {
        id: 'event',
        ticketId: 'ticket',
        type: 'NOTA',
        authorId: null,
        authorName: null,
        createdAt: '2026-10-26T12:00:00Z',
        systemAction: 'TICKET_CREATED',
        message: 'Mensagem técnica antiga',
      }
      expect(formatMaintenanceActivity(event, t)).toBe(t('activityMessages.created'))
      expect(
        formatMaintenanceActivity(
          { ...event, systemAction: null, message: 'Observação livre, com vírgulas.' },
          t,
        ),
      ).toBe('Observação livre, com vírgulas.')
    },
  )
})

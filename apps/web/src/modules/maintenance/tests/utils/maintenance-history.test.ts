import { createTranslator } from 'next-intl'
import { describe, expect, it } from 'vitest'

import pt from '@/i18n/messages/pt-BR/dashboard.json'
import en from '@/i18n/messages/en-US/dashboard.json'
import es from '@/i18n/messages/es-ES/dashboard.json'

import type { ApiMaintenanceActivity } from '../../types/service'
import { formatMaintenanceActivity } from '../../utils/maintenance-activity'

const statusPairs = [
  ['ABERTO', 'OPEN', 'open'],
  ['EM_ANDAMENTO', 'IN_PROGRESS', 'inProgress'],
  ['RESOLVIDO', 'RESOLVED', 'resolved'],
  ['FECHADO', 'CLOSED', 'closed'],
  ['AGUARDANDO_CONFIRMACAO', 'AWAITING_CONFIRMATION', 'pendingConfirmation'],
  ['CONTESTADO', 'DISPUTED', 'contested'],
  ['CANCELADO', 'CANCELED', 'cancelled'],
] as const

function event(details: Record<string, unknown>): ApiMaintenanceActivity {
  return {
    id: 'event',
    ticketId: 'ticket',
    type: 'STATUS_CHANGE',
    systemAction: 'STATUS_CHANGED',
    authorId: null,
    authorName: null,
    createdAt: '2026-10-27T12:00:00Z',
    message: 'RESOLVIDO é texto livre nesta mensagem.',
    details,
  }
}

describe.each([
  ['pt-BR', pt],
  ['en-US', en],
  ['es-ES', es],
] as const)('maintenance history compatibility in %s', (locale, messages) => {
  const translate = createTranslator({
    locale,
    messages: { dashboard: messages },
    namespace: 'dashboard.maintenance',
  })
  const t = (key: string, values?: Record<string, string>) =>
    translate(key as Parameters<typeof translate>[0], values)

  it.each(statusPairs)(
    'renders %s and %s identically without rewriting the JSON',
    (old, next, key) => {
      const legacy = event(Object.freeze({ before: old, after: next, reason: old }))
      const stored = JSON.stringify(legacy)

      expect(formatMaintenanceActivity(legacy, t)).toBe(
        formatMaintenanceActivity(event({ before: next, after: old }), t),
      )
      expect(formatMaintenanceActivity(legacy, t)).toBe(
        t('activityMessages.statusChanged', {
          before: t(`statuses.${key}`),
          after: t(`statuses.${key}`),
        }),
      )
      expect(JSON.stringify(legacy)).toBe(stored)
    },
  )

  it('preserves unknown codes and human messages', () => {
    expect(formatMaintenanceActivity(event({ before: 'UNKNOWN', after: '__proto__' }), t)).toBe(
      t('activityMessages.statusChanged', { before: 'UNKNOWN', after: '__proto__' }),
    )
    const human = { ...event({ before: 'RESOLVIDO' }), systemAction: null }
    expect(formatMaintenanceActivity(human, t)).toBe(human.message)
  })
})

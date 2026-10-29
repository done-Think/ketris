import { describe, expect, it } from 'vitest'
import { assertCanManageAgendaEvent } from '@server/agenda/domain/agenda-access-rules'
import type { AgendaEvent as DomainEvent } from '@server/agenda/domain/agenda-event.entity'
import { canEditAgendaEvent } from '../../utils/can-edit-agenda-event'
import { agendaEventFixture } from '../fixtures/agenda-event'

const scenarios = (['OWNER', 'AGENT', 'PROPERTY_OWNER', 'RENTER'] as const).flatMap((role) =>
  (['SHARED_TEAM', 'ALL_AGENTS', 'ASSIGNED_AGENT'] as const).flatMap((audience) =>
    [false, true].flatMap((internal) =>
      ['user', 'other-user'].flatMap((responsibleId) =>
        ['user', 'other-user'].map((createdById) => ({
          role,
          audience,
          internal,
          responsibleId,
          createdById,
        })),
      ),
    ),
  ),
)
describe('permissões do frontend preservam as regras de Agenda do backend', () => {
  it.each(scenarios)(
    '$role/$audience/internal=$internal/responsible=$responsibleId/creator=$createdById',
    ({ role, audience, internal, responsibleId, createdById }) => {
      const event = agendaEventFixture({ audience, internal, responsibleId, createdById })
      let allowed = true
      try {
        assertCanManageAgendaEvent(role, 'user', {
          internal: internal,
          audience: audience,
          responsibleId: responsibleId,
          createdById: createdById,
        } as DomainEvent)
      } catch {
        allowed = false
      }
      expect(canEditAgendaEvent({ role, userId: 'user' }, event)).toBe(allowed)
    },
  )
  it('não libera edição sem evento ou identidade resolvida', () => {
    expect(canEditAgendaEvent({ role: 'OWNER', userId: 'user' }, null)).toBe(false)
    expect(canEditAgendaEvent({}, agendaEventFixture())).toBe(false)
  })
})

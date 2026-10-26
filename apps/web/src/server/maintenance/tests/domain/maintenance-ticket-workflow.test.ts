import { describe, expect, it } from 'vitest'
import { ConflictError } from '@server/shared/errors'
import { MaintenanceTicketNotFoundError } from '../../domain/errors'
import { isPlannableAction, planTicketAction } from '../../domain/maintenance-ticket-workflow'
import { admin, owner, renter, ticket } from '../fixtures/maintenance-ticket'

describe('Maintenance ticket workflow (domain)', () => {
  it('plans a renter finish with the given instant and audits the previous status', () => {
    const now = new Date('2026-10-26T12:00:00.000Z')
    const plan = planTicketAction(ticket, renter, { action: 'finish' }, now)
    expect(plan.changes).toEqual({
      status: 'RESOLVIDO',
      resolvedAt: now,
      completedByRole: 'RENTER',
      completedById: 'renter',
    })
    expect(plan.activity).toMatchObject({
      type: 'MUDANCA_STATUS',
      authorId: 'renter',
      details: { before: 'ABERTO', after: 'RESOLVIDO', resolvedAt: now.toISOString() },
    })
    expect(plan.request).toBeUndefined()
  })

  it('requires a contract before completing and a reason before contesting', () => {
    expect(() =>
      planTicketAction({ ...ticket, contractId: null, status: 'EM_ANDAMENTO' }, admin, {
        action: 'complete',
      }),
    ).toThrow(ConflictError)
    expect(() =>
      planTicketAction({ ...ticket, status: 'AGUARDANDO_CONFIRMACAO' }, renter, {
        action: 'contest',
        reason: '   ',
      }),
    ).toThrow(ConflictError)
  })

  it('turns a replacement request into a pending request without touching the ticket', () => {
    const plan = planTicketAction({ ...ticket, provider: { name: 'Hidraulica Silva' } }, owner, {
      action: 'requestReplacement',
      reason: ' Prestador nao compareceu ',
    })
    expect(plan.changes).toEqual({})
    expect(plan.request).toEqual({
      kind: 'request',
      actor: owner,
      reason: 'Prestador nao compareceu',
    })
  })

  it('denies actors outside the ticket before planning anything', () => {
    expect(() =>
      planTicketAction(ticket, { ...renter, actorId: 'stranger' }, { action: 'finish' }),
    ).toThrow(MaintenanceTicketNotFoundError)
  })

  it('leaves actions that need lookups to the application layer', () => {
    expect(isPlannableAction({ action: 'assume' })).toBe(false)
    expect(isPlannableAction({ action: 'assign', responsibleId: 'agent' })).toBe(false)
    expect(isPlannableAction({ action: 'linkContract', contractId: 'contract-1' })).toBe(false)
    expect(isPlannableAction({ action: 'cancel' })).toBe(true)
  })
})

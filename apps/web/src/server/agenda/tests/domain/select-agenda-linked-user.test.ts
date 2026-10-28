import { expect, it } from 'vitest'
import { selectAgendaLinkedUser } from '../../domain/select-agenda-linked-user'
import type { AgendaLinkedUserCandidate } from '../../types/linked-user'

function candidate(
  id: string,
  tenantId: string,
  role: AgendaLinkedUserCandidate['role'] = 'AGENT',
): AgendaLinkedUserCandidate {
  return {
    id,
    tenantId,
    role,
    email: 'ana@example.test',
    active: true,
    membershipApprovedAt: new Date(),
  }
}
it.each([false, true])(
  'prioriza a conta elegível do tenant independentemente da ordem (reverse=%s)',
  (reverse) => {
    const users = [
      candidate('local', 'agency'),
      candidate('renter', 'shared', 'RENTER'),
      candidate('foreign', 'other'),
    ]
    expect(
      selectAgendaLinkedUser(reverse ? users.reverse() : users, 'ANA@example.test', 'agency')?.id,
    ).toBe('local')
  },
)
it('aceita somente um locatário elegível fora do tenant', () => {
  expect(
    selectAgendaLinkedUser(
      [candidate('renter', 'shared', 'RENTER'), candidate('staff', 'other')],
      'ana@example.test',
      'agency',
    )?.id,
  ).toBe('renter')
})
it('recusa ambiguidade e ignora contas inativas ou ainda não aprovadas', () => {
  expect(
    selectAgendaLinkedUser(
      [candidate('r1', 'one', 'RENTER'), candidate('r2', 'two', 'RENTER')],
      'ana@example.test',
      'agency',
    ),
  ).toBeNull()
  expect(
    selectAgendaLinkedUser(
      [
        { ...candidate('local', 'agency'), active: false },
        { ...candidate('pending', 'agency'), membershipApprovedAt: null },
      ],
      'ana@example.test',
      'agency',
    ),
  ).toBeNull()
})

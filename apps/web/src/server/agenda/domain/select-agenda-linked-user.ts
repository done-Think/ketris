import { normalizeEmail } from '@server/shared/normalize-email'
import type { AgendaLinkedUserCandidate } from '../types/linked-user'
import { canLinkUserToAgendaEvent } from './agenda-access-rules'

export function selectAgendaLinkedUser(
  users: AgendaLinkedUserCandidate[],
  email: string,
  tenantId: string,
): AgendaLinkedUserCandidate | null {
  const eligible = users.filter(
    (user) =>
      normalizeEmail(user.email) === normalizeEmail(email) &&
      canLinkUserToAgendaEvent(user, tenantId),
  )
  const local = eligible.filter((user) => user.tenantId === tenantId)
  const candidates = local.length ? local : eligible.filter((user) => user.papel === 'RENTER')
  return candidates.length === 1 ? candidates[0] : null
}

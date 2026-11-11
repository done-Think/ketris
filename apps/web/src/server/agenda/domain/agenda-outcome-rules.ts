import { isAgencyManager, isAgencyStaff } from '@server/auth/domain/roles'
import type { UserRole } from '@server/auth/domain/user.entity'
import { ForbiddenError } from '@server/shared/errors'
import {
  hasAgendaEventStarted,
  isAgendaOutcomeStatus,
  requiresAgendaVisitInterest,
} from '@shared/lib/utils/agenda-outcome'

import type { AgendaEventOutcome, AgendaVisitInterest } from '../types/agenda-event'
import { assertCanManageAgendaEvent } from './agenda-access-rules'
import type { AgendaEvent } from './agenda-event.entity'
import {
  AgendaEventClosedError,
  AgendaNoShowInternalEventError,
  AgendaOutcomeBeforeStartError,
  AgendaOutcomeCancelledEventError,
  AgendaVisitInterestNotAllowedError,
  AgendaVisitInterestRequiredError,
} from './errors'

export function assertAgendaEventOpen(event: Pick<AgendaEvent, 'status'>): void {
  if (isAgendaOutcomeStatus(event.status)) throw new AgendaEventClosedError()
}

export function assertCanRecordAgendaOutcome(
  role: UserRole,
  userId: string,
  event: AgendaEvent,
): void {
  if (!isAgencyStaff(role)) throw new ForbiddenError()
  assertCanManageAgendaEvent(role, userId, event)
  if (!isAgencyManager(role)) assertAgendaEventOpen(event)
}

export function assertAgendaOutcomeAllowed(
  event: AgendaEvent,
  outcome: AgendaEventOutcome,
  visitInterest: AgendaVisitInterest | undefined,
  now: Date,
): void {
  if (event.status === 'CANCELLED') throw new AgendaOutcomeCancelledEventError()
  if (!hasAgendaEventStarted(event.start, now)) throw new AgendaOutcomeBeforeStartError()
  if (outcome === 'NO_SHOW' && event.internal) throw new AgendaNoShowInternalEventError()

  const interestRequired = requiresAgendaVisitInterest(outcome, event.type)
  if (interestRequired && !visitInterest) throw new AgendaVisitInterestRequiredError()
  if (!interestRequired && visitInterest) throw new AgendaVisitInterestNotAllowedError()
}

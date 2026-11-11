export const AGENDA_EVENT_OUTCOMES = ['COMPLETED', 'NO_SHOW'] as const
export const AGENDA_VISIT_INTERESTS = ['LOW', 'MEDIUM', 'HIGH'] as const
export const AGENDA_OUTCOME_NOTES_MAX_LENGTH = 10000

export function isAgendaOutcomeStatus(status: string): boolean {
  return (AGENDA_EVENT_OUTCOMES as readonly string[]).includes(status)
}

export function hasAgendaEventStarted(start: Date, now: Date): boolean {
  return start.getTime() <= now.getTime()
}

export function requiresAgendaVisitInterest(
  outcome: string,
  kind: string | null | undefined,
): boolean {
  return outcome === 'COMPLETED' && kind === 'VISIT'
}

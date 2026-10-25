export type AgendaAuditAction = 'CREATED' | 'UPDATED' | 'RESCHEDULED' | 'CANCELLED'
export interface AgendaAuditInput {
  tenantId: string
  eventId: string
  actorUserId?: string | null
  action: AgendaAuditAction
  changedFields?: string[]
  cancellationReason?: string | null
}
export interface AgendaCancellation {
  reason: string
  actorUserId?: string
}

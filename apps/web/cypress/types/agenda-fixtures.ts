export interface AgendaFixtureSeedInput {
  suffix: string
  password: string
}
export interface AgendaFixtureSeedResult {
  tenantIds: string[]
  tenantId: string
  ownerId: string
  agentId: string
  renterId: string
  ownerEmail: string
  agentEmail: string
  renterEmail: string
  ownerName: string
  propertyId: string
  privatePropertyId: string
}
export interface AgendaAuditResult {
  action: 'CREATED' | 'UPDATED' | 'RESCHEDULED' | 'CANCELLED'
  actorUserId: string | null
  cancellationReason: string | null
}

export interface CrmFixtureInput {
  suffix: string
  password: string
  empty?: boolean
}
export interface CrmFixtureResult {
  tenantId: string
  foreignTenantId: string
  ownerEmail: string
  agentEmail: string
  propertyId: string
  propertyTitle: string
  contactId: string | null
  contactName: string
  opportunityId: string | null
  linkedOpportunityId: string | null
  foreignOpportunityId: string
}
export interface CrmEvidence {
  contact: { name: string; email: string; phone: string | null } | null
  opportunities: {
    id: string
    leadName: string
    leadEmail: string
    specialConditions: string[]
    notes: string | null
  }[]
  audits: {
    action: string
    entityType: string
    actorUserId: string | null
    changedFields: string[]
  }[]
}

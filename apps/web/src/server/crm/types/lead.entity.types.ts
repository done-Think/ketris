import type { LeadSource } from './lead-source'
export type LeadStage = 'NEW' | 'IN_CONTACT' | 'VISIT_SCHEDULED' | 'PROPOSAL'

export interface Lead {
  propertyId?: string | null
  responsibleName?: string
  id: string
  tenantId: string
  responsibleId: string
  name: string
  phone: string
  email: string | null
  interest: string
  budget: string
  source: LeadSource
  stage: LeadStage
  notes: string | null
  opportunityId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface NewLead {
  propertyId?: string | null
  tenantId: string
  responsibleId: string
  name: string
  phone: string
  email: string | null
  interest: string
  budget: string
  source: LeadSource
  notes: string | null
}

export interface LeadUpdate {
  stage?: LeadStage
  notes?: string | null
}

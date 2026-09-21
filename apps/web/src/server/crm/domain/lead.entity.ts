export type LeadStage = 'NOVO' | 'EM_CONTATO' | 'VISITA_MARCADA' | 'PROPOSTA'

export interface Lead {
  id: string
  tenantId: string
  responsavelId: string
  name: string
  phone: string
  email: string | null
  interest: string
  budget: string
  source: string
  stage: LeadStage
  notes: string | null
  opportunityId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface NewLead {
  tenantId: string
  responsavelId: string
  name: string
  phone: string
  email: string | null
  interest: string
  budget: string
  source: string
  notes: string | null
}

export interface LeadUpdate {
  stage?: LeadStage
  notes?: string | null
}

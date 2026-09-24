import type { DashboardLead, Lead, LeadApiStage, LeadStage } from '../types/lead'
import { formatLeadRelativeDate } from './format-lead'

const stageByApiStage: Record<LeadApiStage, LeadStage> = {
  NOVO: 'Novo',
  EM_CONTATO: 'Em contato',
  VISITA_MARCADA: 'Visita marcada',
  PROPOSTA: 'Proposta',
}

export const apiStageByStage: Record<LeadStage, LeadApiStage> = {
  Novo: 'NOVO',
  'Em contato': 'EM_CONTATO',
  'Visita marcada': 'VISITA_MARCADA',
  Proposta: 'PROPOSTA',
}

export function toDashboardLead(lead: Lead): DashboardLead {
  return {
    id: lead.id,
    name: lead.name,
    budget: lead.budget,
    phone: lead.phone,
    email: lead.email ?? '',
    lastContact: formatLeadRelativeDate(lead.updatedAt),
    lastContactAt: lead.updatedAt,
    interest: lead.interest,
    source: lead.source,
    // Broker name resolution is blocked by an admin-only route today — same simplification already
    // accepted for properties (ver map-dashboard-property.ts).
    broker: '',
    stage: stageByApiStage[lead.stage],
    opportunityId: lead.opportunityId,
  }
}

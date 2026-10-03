import type { Lead } from '@modules/crm/types/lead'

import type { DashboardRecentLead, DashboardRecentLeadStatus } from '../types/dashboard-overview'

const statusByStage: Record<Lead['stage'], DashboardRecentLeadStatus> = {
  NOVO: 'new',
  EM_CONTATO: 'inProgress',
  VISITA_MARCADA: 'qualified',
  PROPOSTA: 'pending',
}

export function toDashboardRecentLead(lead: Lead): DashboardRecentLead {
  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    interest: lead.interest,
    budget: lead.budget,
    source: lead.source,
    status: statusByStage[lead.stage],
    notes: lead.notes ?? '',
  }
}

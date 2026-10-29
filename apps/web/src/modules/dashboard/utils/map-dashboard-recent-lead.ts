import type { DashboardRecentLead, DashboardRecentLeadStatus } from '../types/dashboard-overview'
import type { ApiDashboardLeadStage, ApiDashboardRecentLead } from '../types/service'

const statusByStage: Record<ApiDashboardLeadStage, DashboardRecentLeadStatus> = {
  NEW: 'new',
  IN_CONTACT: 'inProgress',
  VISIT_SCHEDULED: 'qualified',
  PROPOSAL: 'pending',
}

export function toDashboardRecentLead(lead: ApiDashboardRecentLead): DashboardRecentLead {
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

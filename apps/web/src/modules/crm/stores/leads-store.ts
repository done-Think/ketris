import { create } from 'zustand'

import { dashboardLeads } from '../data/leads'
import type { CreateLeadFormValues, DashboardLead, LeadsStoreState } from '../types/lead'

function createLeadListItem(
  values: CreateLeadFormValues,
  leadCount: number,
  lastContactLabel: string,
): DashboardLead {
  const nextLeadNumber = String(leadCount + 1).padStart(3, '0')

  return {
    id: `lead-${nextLeadNumber}`,
    name: values.name,
    budget: values.budget,
    phone: values.phone,
    email: values.email,
    lastContact: lastContactLabel,
    interest: values.interest,
    source: values.source,
    broker: values.broker,
    stage: values.stage,
  }
}

export const useLeadsStore = create<LeadsStoreState>((set, get) => ({
  leads: dashboardLeads,
  addLead: (values, lastContactLabel) => {
    const lead = createLeadListItem(values, get().leads.length, lastContactLabel)

    set((state) => ({
      leads: [lead, ...state.leads],
    }))

    return lead
  },
}))

import { create } from 'zustand'

import { dashboardRecentLeads } from '../data/dashboard-overview'
import type { DashboardStoreState } from '../types/dashboard-overview'

export const useDashboardStore = create<DashboardStoreState>((set) => ({
  leads: dashboardRecentLeads,
  updateLeadDetails: (leadId, values) =>
    set((state) => ({
      leads: state.leads.map((lead) => (lead.id === leadId ? { ...lead, ...values } : lead)),
    })),
}))

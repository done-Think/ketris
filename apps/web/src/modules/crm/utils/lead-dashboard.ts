import type { DashboardLead, LeadFilterKey } from '../types/lead'

export function getFilterCount(leads: DashboardLead[], filter: LeadFilterKey) {
  if (filter === 'Todos') return leads.length

  return leads.filter((lead) => lead.stage === filter).length
}

export function getLeadInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('pt-BR')
}

export function filterLeads(
  leads: DashboardLead[],
  searchQuery: string,
  activeFilter: LeadFilterKey,
) {
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase('pt-BR')

  return leads.filter((lead) => {
    const matchesFilter = activeFilter === 'Todos' || lead.stage === activeFilter
    const matchesSearch =
      !normalizedSearch ||
      [lead.name, lead.interest, lead.source, lead.broker].some((value) =>
        value.toLocaleLowerCase('pt-BR').includes(normalizedSearch),
      )

    return matchesFilter && matchesSearch
  })
}

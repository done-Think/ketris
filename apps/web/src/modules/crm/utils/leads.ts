import type { DashboardLead, LeadFilter, LeadsPage } from '../types/lead'

export const leadsDefaultPageSize = 5

function normalizeSearchValue(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('pt-BR').trim()
}

export function filterLeads(
  leads: readonly DashboardLead[],
  search = '',
  activeFilter: LeadFilter = 'Todos',
): DashboardLead[] {
  const normalizedSearch = normalizeSearchValue(search)

  return leads.filter((lead) => {
    if (activeFilter !== 'Todos' && lead.stage !== activeFilter) return false
    if (!normalizedSearch) return true

    return [lead.name, lead.interest, lead.source, lead.broker].some((value) =>
      normalizeSearchValue(value).includes(normalizedSearch),
    )
  })
}

export function getLeadFilterCount(leads: readonly DashboardLead[], filter: LeadFilter): number {
  if (filter === 'Todos') return leads.length

  return leads.filter((lead) => lead.stage === filter).length
}

export function paginateLeads(
  leads: readonly DashboardLead[],
  requestedPage = 1,
  pageSize = leadsDefaultPageSize,
): LeadsPage {
  const totalCount = leads.length
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))
  const normalizedPage = Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1
  const page = Math.min(Math.max(normalizedPage, 1), pageCount)
  const startIndex = (page - 1) * pageSize
  const items = leads.slice(startIndex, startIndex + pageSize)

  return {
    items,
    page,
    pageCount,
    totalCount,
    firstItem: items.length > 0 ? startIndex + 1 : 0,
    lastItem: items.length > 0 ? startIndex + items.length : 0,
  }
}

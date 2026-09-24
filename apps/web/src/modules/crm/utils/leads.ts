import type { DashboardLead, LeadFilter, LeadTableSortState, LeadsPage } from '../types/lead'

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

// "R$ 500K" / "R$ 1.5M": abreviação, "." é ponto decimal. "R$ 1.850.000" / "Até R$ 8.000": formato
// brasileiro por extenso, "." é separador de milhar e "," é decimal — os dois formatos convivem
// no mesmo campo de texto livre (ver CreateLeadDialog), então o sufixo precisa ser detectado logo
// após o número, não em qualquer lugar da string (evita falso positivo em algo como "/mês").
function parseBudgetValue(budget: string): number {
  const match = budget.match(/([\d.,]+)\s*(m|k)?/i)

  if (!match) return 0

  const [, rawNumber, suffix] = match
  const upperSuffix = suffix?.toUpperCase()

  if (upperSuffix === 'M' || upperSuffix === 'K') {
    const value = Number(rawNumber.replace(',', '.'))

    if (!Number.isFinite(value)) return 0

    return upperSuffix === 'M' ? value * 1_000_000 : value * 1_000
  }

  const value = Number(rawNumber.replace(/\./g, '').replace(',', '.'))

  return Number.isFinite(value) ? value : 0
}

const leadStageOrder: Record<DashboardLead['stage'], number> = {
  Novo: 0,
  'Em contato': 1,
  'Visita marcada': 2,
  Proposta: 3,
}

function getLeadSortValue(lead: DashboardLead, sort: NonNullable<LeadTableSortState>) {
  if (sort.field === 'budget') return parseBudgetValue(lead.budget)
  if (sort.field === 'stage') return leadStageOrder[lead.stage]
  if (sort.field === 'lastContact') return new Date(lead.lastContactAt).getTime()

  return lead[sort.field]
}

export function sortLeads(
  leads: readonly DashboardLead[],
  sort: LeadTableSortState,
): DashboardLead[] {
  if (!sort) return [...leads]

  return [...leads].sort((firstLead, secondLead) => {
    const firstValue = getLeadSortValue(firstLead, sort)
    const secondValue = getLeadSortValue(secondLead, sort)
    const directionMultiplier = sort.direction === 'asc' ? 1 : -1

    if (typeof firstValue === 'number' && typeof secondValue === 'number') {
      return (firstValue - secondValue) * directionMultiplier
    }

    return (
      String(firstValue).localeCompare(String(secondValue), 'pt-BR', {
        sensitivity: 'base',
      }) * directionMultiplier
    )
  })
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

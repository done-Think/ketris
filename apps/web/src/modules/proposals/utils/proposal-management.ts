import { proposalStatusPresentations } from '../config/proposal-statuses'
import type {
  ProposalManagementFilterId,
  ProposalManagementListItem,
  ProposalManagementPage,
  ProposalManagementQuery,
} from '../types/proposal-management'

export const proposalManagementDefaultPageSize = 5

function normalizeSearchValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}

export function filterProposalManagementItems(
  proposals: readonly ProposalManagementListItem[],
  search = '',
  status: ProposalManagementFilterId = 'all',
): ProposalManagementListItem[] {
  const normalizedSearch = normalizeSearchValue(search)

  return proposals.filter((proposal) => {
    if (status !== 'all' && proposal.status !== status) return false
    if (!normalizedSearch) return true

    const searchableValues = [
      proposal.id,
      proposal.reference,
      proposal.lead.name,
      proposal.lead.email,
      proposal.property.title,
      proposal.property.address,
      proposal.valueLabel,
      proposal.createdLabel,
      proposalStatusPresentations[proposal.status].label,
    ]

    return searchableValues.some((value) => normalizeSearchValue(value).includes(normalizedSearch))
  })
}

export function paginateProposalManagementItems(
  proposals: readonly ProposalManagementListItem[],
  requestedPage = 1,
  requestedPageSize = proposalManagementDefaultPageSize,
): ProposalManagementPage {
  const pageSize =
    Number.isFinite(requestedPageSize) && requestedPageSize > 0
      ? Math.floor(requestedPageSize)
      : proposalManagementDefaultPageSize
  const totalCount = proposals.length
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))
  const normalizedPage = Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1
  const page = Math.min(Math.max(normalizedPage, 1), pageCount)
  const startIndex = (page - 1) * pageSize
  const items = proposals.slice(startIndex, startIndex + pageSize)

  return {
    items,
    page,
    pageSize,
    pageCount,
    totalCount,
    firstItem: items.length > 0 ? startIndex + 1 : 0,
    lastItem: items.length > 0 ? startIndex + items.length : 0,
  }
}

export function queryProposalManagementItems(
  proposals: readonly ProposalManagementListItem[],
  { search = '', status = 'all', page = 1, pageSize }: ProposalManagementQuery = {},
): ProposalManagementPage {
  const filteredProposals = filterProposalManagementItems(proposals, search, status)

  return paginateProposalManagementItems(filteredProposals, page, pageSize)
}

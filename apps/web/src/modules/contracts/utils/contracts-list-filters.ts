import type { GridSortModel } from '@mui/x-data-grid'
import type { ContractsFiltersFormValues } from '../types/contract'
import type { ContractListFilters } from '../types/service'

export function contractsListFilters(
  values: ContractsFiltersFormValues,
  sort: GridSortModel,
  locale: string,
): ContractListFilters {
  const selectedSort = sort[0]
  const field = selectedSort?.field
  const sortBy =
    field === 'property' ||
    field === 'tenant' ||
    field === 'amount' ||
    field === 'startDate' ||
    field === 'endDate' ||
    field === 'status'
      ? field
      : 'updatedAt'
  return {
    ...(values.searchQuery.trim() ? { search: values.searchQuery.trim() } : {}),
    ...(values.status !== 'ALL' ? { status: values.status } : {}),
    ...(values.type !== 'ALL' ? { type: values.type } : {}),
    period: values.period,
    sortBy,
    sortOrder: selectedSort?.sort ?? 'desc',
    locale: locale === 'en-US' || locale === 'es-ES' ? locale : 'pt-BR',
  }
}

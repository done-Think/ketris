import { useListState } from '@shared/hooks/use-list-state'
import type { ContractsFiltersFormValues, ContractTableState } from '../types/contract'
import type { GridPaginationModel, GridSortModel } from '@mui/x-data-grid'
import { contractsListFilters } from '../utils/contracts-list-filters'

export function useContractTableState(values: ContractsFiltersFormValues, locale: string) {
  const { filters: state, setFilter } = useListState<ContractTableState>({
    sort: [],
    paging: { filterKey: '', model: { page: 0, pageSize: 5 } },
  })
  const filters = contractsListFilters(values, state.sort, locale)
  const filterKey = JSON.stringify(filters)
  return {
    filters,
    sort: state.sort,
    model:
      state.paging.filterKey === filterKey
        ? state.paging.model
        : { ...state.paging.model, page: 0 },
    onPagination: (model: GridPaginationModel) => setFilter('paging', { filterKey, model }),
    onSort: (sort: GridSortModel) => setFilter('sort', sort),
  }
}

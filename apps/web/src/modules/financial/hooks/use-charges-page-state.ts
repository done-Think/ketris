import { useState } from 'react'

import { useDebouncedValue } from '@shared/hooks/use-debounced-value'
import { useListState } from '@shared/hooks/use-list-state'

import { directionToApiType, uiStatusToApi } from '../config/charge-status'
import type { ChargesPageDialog, ChargesPageFilters } from '../types/charge'
import type { ChargeListFilters } from '../types/service'

const initialFilters: ChargesPageFilters = {
  direction: 'receivable',
  status: 'all',
  search: '',
  page: 1,
  rowsPerPage: 6,
}

export function useChargesPageState(onlyReceivables: boolean) {
  const { filters, setFilter } = useListState(initialFilters)
  const [dialog, setDialog] = useState<ChargesPageDialog | null>(null)
  const search = useDebouncedValue(filters.search.trim(), 300)
  const query: ChargeListFilters = {
    type: directionToApiType[onlyReceivables ? 'receivable' : filters.direction],
    status: filters.status === 'all' ? undefined : uiStatusToApi[filters.status],
    search: search || undefined,
    page: filters.page,
    pageSize: filters.rowsPerPage,
  }

  return {
    filters,
    query,
    dialog,
    openDialog: setDialog,
    closeDialog: () => setDialog(null),
    setSearch: (value: string) => {
      setFilter('search', value)
      setFilter('page', 1)
    },
    setStatus: (value: ChargesPageFilters['status']) => {
      setFilter('status', value)
      setFilter('page', 1)
    },
    setDirection: (value: ChargesPageFilters['direction']) => {
      setFilter('direction', value)
      setFilter('status', 'all')
      setFilter('page', 1)
    },
    setPage: (value: number) => setFilter('page', value),
    setRowsPerPage: (value: number) => {
      setFilter('rowsPerPage', value)
      setFilter('page', 1)
    },
  }
}

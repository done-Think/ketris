'use client'

import { useCallback, useState } from 'react'

import type { ListState } from '@shared/types/list-state'

export function useListState<TFilters>(initialFilters: TFilters): ListState<TFilters> {
  const [filters, setFilters] = useState(initialFilters)
  const setFilter = useCallback(<TKey extends keyof TFilters>(key: TKey, value: TFilters[TKey]) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }, [])
  const updateFilters = useCallback((changes: Partial<TFilters>) => {
    setFilters((current) => ({ ...current, ...changes }))
  }, [])

  return { filters, setFilter, updateFilters }
}

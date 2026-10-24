export interface ListState<TFilters> {
  filters: TFilters
  setFilter: <TKey extends keyof TFilters>(key: TKey, value: TFilters[TKey]) => void
}

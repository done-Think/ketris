export interface CrmListFilters {
  q?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  locale?: 'pt-BR' | 'en-US' | 'es-ES'
}

export interface CrmPageGroup {
  key: string
  count: number
  amount: number
  rental: number
  sale: number
  unclassified: number
}

export interface CrmPage<T> {
  items: T[]
  pagination: { page: number; pageSize: number; pageCount: number; totalCount: number }
  groups: CrmPageGroup[]
}

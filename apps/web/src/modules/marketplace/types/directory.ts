import type { ReactNode, RefObject } from 'react'

import type { ViewMode } from './search'

export type DirectoryQuery = {
  q?: string
  page: number
  pageSize: number
}

export type DirectoryPage<TItem> = {
  items: TItem[]
  totalCount: number
  page: number
  pageSize: number
}

export type DirectoryListFilters = {
  q: string
  pageSize: number
}

export type UseDirectoryListParams<TApi, TItem> = {
  queryKey: (filters: DirectoryListFilters) => readonly unknown[]
  fetchPage: (query: DirectoryQuery) => Promise<DirectoryPage<TApi>>
  toItem: (item: TApi) => TItem
  pageSize: number
}

export type UseDirectoryListResult<TItem> = {
  items: TItem[]
  totalCount: number
  hasMoreItems: boolean
  isLoading: boolean
  isLoadingMore: boolean
  isError: boolean
  loadMoreRef: RefObject<HTMLDivElement>
  search: string
  setSearch: (value: string) => void
}

export type DirectoryPageHeaderProps = {
  actions?: ReactNode
  placeholder: string
  resultCountLabel: string
  search: string
  onSearchChange: (value: string) => void
  title: string
}

export type DirectoryLoadMoreStatusProps = {
  emptyLabel: string
  hasItems: boolean
  hasMoreItems: boolean
  isLoadingMore: boolean
  loadedLabel: string
  loadingLabel: string
  loadMoreRef: RefObject<HTMLDivElement>
}

export type DirectoryViewModeToggleProps = {
  value: ViewMode
  onChange: (viewMode: ViewMode) => void
}

import type { ReactNode, RefObject } from 'react'
import type { UseFormRegister } from 'react-hook-form'

import type { ViewMode } from './search'

export type DirectorySearchFormValues = {
  isLoadingMore: boolean
  searchQuery: string
  visibleCount: number
}

export type UseDirectoryListParams<TItem> = {
  items: TItem[]
  initialCount: number
  pageSize: number
  getSearchableText: (item: TItem) => string
}

export type UseDirectoryListResult<TItem> = {
  filteredItems: TItem[]
  hasMoreItems: boolean
  isLoadingMore: boolean
  loadMoreRef: RefObject<HTMLDivElement>
  register: UseFormRegister<DirectorySearchFormValues>
  visibleItems: TItem[]
}

export type DirectoryPageHeaderProps = {
  actions?: ReactNode
  placeholder: string
  resultCountLabel: string
  searchInputProps: ReturnType<UseFormRegister<DirectorySearchFormValues>>
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

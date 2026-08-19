import type { RefObject } from 'react'
import type { UseFormRegister } from 'react-hook-form'

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

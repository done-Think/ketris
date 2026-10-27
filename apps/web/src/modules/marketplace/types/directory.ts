import type { ReactNode, RefObject } from 'react'
import type { UseFormRegister } from 'react-hook-form'

import type { ViewMode } from './search'

export type DirectorySearchFormValues = {
  searchQuery: string
}

export type DirectoryListParams = {
  q?: string
  page: number
  pageSize: number
}

export type DirectoryPage = {
  totalCount: number
  page: number
  pageSize: number
}

export type UseDirectorySearchResult = {
  register: UseFormRegister<DirectorySearchFormValues>
  search: string
}

export type UseLoadMoreOnScrollParams = {
  enabled: boolean
  onLoadMore: () => void
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
  loadMoreRef: RefObject<HTMLDivElement | null>
}

export type DirectoryViewModeToggleProps = {
  value: ViewMode
  onChange: (viewMode: ViewMode) => void
}

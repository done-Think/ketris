export interface ProfileDirectoryFilters {
  q?: string
}

export interface ProfileDirectoryPage {
  page: number
  pageSize: number
}

export interface ProfileDirectoryResult<TItem> {
  items: TItem[]
  totalCount: number
}

export type ListPublicProfilesInput = ProfileDirectoryFilters & ProfileDirectoryPage

export type ListPublicProfilesOutput<TItem> = ProfileDirectoryResult<TItem> & ProfileDirectoryPage

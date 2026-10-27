export interface DirectoryQuery {
  q?: string
  page: number
  pageSize: number
}

export interface DirectoryPage<TItem> {
  items: TItem[]
  totalCount: number
  page: number
  pageSize: number
}

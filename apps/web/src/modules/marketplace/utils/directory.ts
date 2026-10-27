import type { DirectoryPage } from '../types/directory'

// The page after the last loaded one, while the server still has profiles to send.
export function nextDirectoryPage(lastPage: DirectoryPage): number | undefined {
  return lastPage.page * lastPage.pageSize < lastPage.totalCount ? lastPage.page + 1 : undefined
}

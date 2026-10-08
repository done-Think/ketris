export type DashboardTablePaginationProps = {
  count: number
  page: number
  rowsPerPage: number
  rowsPerPageOptions?: number[]
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
}

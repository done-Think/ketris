import { alpha, brand } from '@shared/theme/tokens'

export const platformTenantGridSx = {
  border: 0,
  '& .MuiDataGrid-columnHeaders': {
    bgcolor: brand.neutral[50],
    color: brand.neutral[500],
    fontSize: 12,
    fontWeight: 900,
    textTransform: 'uppercase',
  },
  '& .MuiDataGrid-columnSeparator': { display: 'none' },
  '& .MuiDataGrid-cell': {
    alignItems: 'center',
    borderColor: alpha.graphite[6],
    color: brand.neutral[500],
    display: 'flex',
    fontSize: 13.5,
    fontWeight: 600,
    outline: 'none',
    py: 0,
  },
  '& .MuiDataGrid-cellContent': {
    alignItems: 'center',
    display: 'flex',
    height: '100%',
  },
  '& .MuiDataGrid-row:hover': { bgcolor: brand.neutral[50] },
  '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
  '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
    outline: 'none',
  },
  '& .MuiDataGrid-virtualScroller': { overflowX: 'auto' },
}

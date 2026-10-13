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
    py: 0,
  },
  '& .MuiDataGrid-cellContent': {
    alignItems: 'center',
    display: 'flex',
    height: '100%',
  },
  '& .MuiDataGrid-row:hover': { bgcolor: brand.neutral[50] },
  '& .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus-within': {
    outline: `2px solid ${brand.magenta[500]}`,
    outlineOffset: -2,
  },
  '& .MuiDataGrid-virtualScroller': { overflowX: 'auto' },
}

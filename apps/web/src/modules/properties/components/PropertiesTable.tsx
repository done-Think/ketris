'use client'

import { Box, Chip, IconButton, Stack, Typography } from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import type { GridColDef, GridRenderCellParams, GridRowParams } from '@mui/x-data-grid'
import { DataGrid } from '@mui/x-data-grid'

import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import { dashboardPropertyStatusStyles } from '../config/dashboard-property-ui'
import type { DashboardProperty, PropertiesTableProps } from '../types/dashboard-property'

function PropertyIdentityCell({ row }: GridRenderCellParams<DashboardProperty>) {
  return (
    <Stack direction="row" alignItems="center" spacing={2.2} sx={{ minWidth: 0, width: '100%' }}>
      <Box
        component="img"
        src={row.imageUrl}
        alt=""
        sx={{
          width: 103,
          height: 103,
          borderRadius: `${radius.sm}px`,
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap sx={{ fontSize: 17, fontWeight: 900 }}>
          {row.title}
        </Typography>
        <Typography noWrap sx={{ color: 'text.secondary', fontSize: 14, mt: 0.4 }}>
          {row.address}
        </Typography>
      </Box>
    </Stack>
  )
}

function PropertyStatusCell({ row }: GridRenderCellParams<DashboardProperty>) {
  const status = dashboardPropertyStatusStyles[row.status]

  return (
    <Chip
      label={row.status}
      size="small"
      sx={{
        height: 30,
        borderRadius: `${radius.full}px`,
        bgcolor: status.bgcolor,
        color: status.color,
        fontSize: 13,
        fontWeight: 900,
      }}
    />
  )
}

export function PropertiesTable({
  properties,
  totalCount,
  onPropertySelect,
}: PropertiesTableProps) {
  const columns: GridColDef<DashboardProperty>[] = [
    {
      field: 'title',
      headerName: 'Imóvel',
      flex: 2.2,
      minWidth: 360,
      sortable: true,
      renderCell: (params) => <PropertyIdentityCell {...params} />,
    },
    { field: 'type', headerName: 'Tipo', flex: 0.9, minWidth: 130 },
    { field: 'price', headerName: 'Preço', flex: 1, minWidth: 150 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.8,
      minWidth: 130,
      renderCell: (params) => <PropertyStatusCell {...params} />,
    },
    { field: 'broker', headerName: 'Corretor', flex: 1, minWidth: 160 },
    { field: 'updatedAt', headerName: 'Atualizado', flex: 0.9, minWidth: 140 },
    {
      field: 'actions',
      headerName: 'Ações',
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      width: 112,
      align: 'right',
      headerAlign: 'right',
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.8} justifyContent="flex-end" sx={{ width: '100%' }}>
          <IconButton
            aria-label={`Editar ${row.title}`}
            onClick={(event) => event.stopPropagation()}
            sx={{
              width: 36,
              height: 36,
              border: '1px solid',
              borderColor: 'divider',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'primary.main',
                color: 'primary.main',
                bgcolor: alpha.magenta[6],
              },
            }}
          >
            <EditOutlinedIcon sx={{ fontSize: iconSize.md }} />
          </IconButton>
          <IconButton
            aria-label={`Visualizar ${row.title}`}
            onClick={(event) => {
              event.stopPropagation()
              onPropertySelect(row.id)
            }}
            sx={{
              width: 36,
              height: 36,
              border: '1px solid',
              borderColor: 'divider',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'primary.main',
                color: 'primary.main',
                bgcolor: alpha.magenta[6],
              },
            }}
          >
            <VisibilityOutlinedIcon sx={{ fontSize: iconSize.md }} />
          </IconButton>
        </Stack>
      ),
    },
  ]

  return (
    <Box
      sx={{
        bgcolor: surface.paper,
        borderRadius: `${radius.sm}px`,
        boxShadow: shadows.propertyCard,
        border: '1px solid',
        borderColor: alpha.graphite[6],
        width: '100%',
        minWidth: 0,
      }}
    >
      <DataGrid
        rows={properties}
        columns={columns}
        autoHeight
        rowHeight={138}
        disableRowSelectionOnClick
        pageSizeOptions={[5, 10, 25]}
        initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
        localeText={{
          noRowsLabel: 'Nenhum imóvel encontrado',
          footerTotalRows: 'Total de linhas:',
          MuiTablePagination: {
            labelRowsPerPage: 'Linhas por página',
            labelDisplayedRows: ({ from, to }) => `${from}-${to} de ${totalCount}`,
          },
        }}
        onRowClick={(params: GridRowParams<DashboardProperty>) => onPropertySelect(params.row.id)}
        sx={{
          border: 0,
          minHeight: 400,
          '& .MuiDataGrid-columnHeaders': {
            bgcolor: brand.neutral[50],
            color: brand.neutral[500],
            fontSize: 12,
            fontWeight: 900,
            textTransform: 'uppercase',
          },
          '& .MuiDataGrid-cell': {
            alignItems: 'center',
            borderColor: 'divider',
            display: 'flex',
            outline: 'none',
          },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
            outline: 'none',
          },
          '& .MuiDataGrid-row': {
            cursor: 'pointer',
          },
          '& .MuiDataGrid-row:hover': {
            bgcolor: brand.neutral[50],
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid',
            borderColor: 'divider',
          },
        }}
      />
    </Box>
  )
}

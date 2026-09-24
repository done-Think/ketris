'use client'

import { Box, Chip, Stack, Typography } from '@mui/material'
import type { GridColDef, GridRenderCellParams, GridRowParams } from '@mui/x-data-grid'
import { DataGrid } from '@mui/x-data-grid'
import { useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import { dashboardPropertyStatusStyles } from '../config/dashboard-property-ui'
import type { DashboardProperty, PropertiesTableProps } from '../types/dashboard-property'
import { PropertyRowActions } from './PropertyRowActions'

function PropertyIdentityCell({ row }: GridRenderCellParams<DashboardProperty>) {
  return (
    <Stack direction="row" alignItems="center" spacing={2} sx={{ minWidth: 0, height: '100%' }}>
      {row.imageUrl ? (
        <Box
          component="img"
          src={row.imageUrl}
          alt=""
          sx={{
            width: 56,
            height: 56,
            borderRadius: `${radius.sm}px`,
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      ) : null}
      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap sx={{ fontSize: 15, fontWeight: 900 }}>
          {row.title}
        </Typography>
        <Typography noWrap sx={{ color: 'text.secondary', fontSize: 13 }}>
          {row.address}
        </Typography>
      </Box>
    </Stack>
  )
}

function PropertyStatusCell({
  row,
  label,
}: GridRenderCellParams<DashboardProperty> & { label: string }) {
  const status = dashboardPropertyStatusStyles[row.status]

  return (
    <Chip
      label={label}
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
  const t = useTranslations('properties.dashboard.table')
  const filterT = useTranslations('properties.dashboard.filters')
  const columns: GridColDef<DashboardProperty>[] = [
    {
      field: 'title',
      headerName: t('property'),
      flex: 2.2,
      minWidth: 360,
      sortable: true,
      renderCell: (params) => <PropertyIdentityCell {...params} />,
    },
    { field: 'type', headerName: t('type'), flex: 0.9, minWidth: 130 },
    { field: 'price', headerName: t('price'), flex: 1, minWidth: 150 },
    {
      field: 'status',
      headerName: t('status'),
      flex: 0.8,
      minWidth: 130,
      renderCell: (params) => <PropertyStatusCell {...params} label={filterT(params.row.status)} />,
    },
    { field: 'broker', headerName: t('broker'), flex: 1, minWidth: 160 },
    { field: 'updatedAt', headerName: t('updated'), flex: 0.9, minWidth: 140 },
    {
      field: 'actions',
      headerName: t('actions'),
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      width: 96,
      align: 'right',
      headerAlign: 'right',
      renderCell: ({ row }) => (
        <PropertyRowActions property={row} onView={() => onPropertySelect(row.id)} />
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
        rowHeight={82}
        disableRowSelectionOnClick
        pageSizeOptions={[5, 10, 25]}
        initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
        localeText={{
          noRowsLabel: t('noRows'),
          footerTotalRows: t('totalRows'),
          MuiTablePagination: {
            labelRowsPerPage: t('rowsPerPage'),
            labelDisplayedRows: ({ from, to }) =>
              t('displayedRows', { from, to, count: totalCount }),
          },
        }}
        getRowClassName={({ indexRelativeToCurrentPage }) =>
          indexRelativeToCurrentPage % 2 === 1 ? 'properties-row-alt' : 'properties-row-base'
        }
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
            borderColor: 'divider',
            outline: 'none',
          },
          '& .MuiDataGrid-row': {
            cursor: 'pointer',
          },
          '& .MuiDataGrid-row.properties-row-base': {
            bgcolor: surface.paper,
          },
          '& .MuiDataGrid-row.properties-row-alt': {
            bgcolor: surface.app,
          },
          '& .MuiDataGrid-row:hover': {
            bgcolor: `${alpha.graphite[6]} !important`,
          },
          '& .MuiDataGrid-footerContainer': {
            borderColor: brand.neutral[100],
          },
        }}
      />
    </Box>
  )
}

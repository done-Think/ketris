'use client'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import type { GridColDef, GridRenderCellParams, GridRowParams } from '@mui/x-data-grid'
import { DataGrid } from '@mui/x-data-grid'
import { useTranslations } from 'next-intl'

import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

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
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
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
    </Box>
  )
}

function PropertiesEmptyOverlay({
  emptyInventory,
  onCreateProperty,
}: {
  emptyInventory: boolean
  onCreateProperty: () => void
}) {
  const t = useTranslations('properties.dashboard.table')

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={1.4}
      sx={{
        minHeight: 220,
        px: 3,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: `${radius.full}px`,
          display: 'grid',
          placeItems: 'center',
          bgcolor: alpha.magenta[10],
          color: brand.magenta[500],
        }}
      >
        <HomeWorkOutlinedIcon sx={{ fontSize: iconSize.lg }} />
      </Box>
      <Box>
        <Typography sx={{ fontSize: 16, fontWeight: 900, color: brand.graphite[500] }}>
          {emptyInventory ? t('emptyTitle') : t('noRows')}
        </Typography>
        {emptyInventory ? (
          <Typography sx={{ mt: 0.5, color: brand.neutral[500], fontSize: 13 }}>
            {t('emptyDescription')}
          </Typography>
        ) : null}
      </Box>
      {emptyInventory ? (
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon sx={{ fontSize: iconSize.sm }} />}
          onClick={onCreateProperty}
          sx={{
            mt: 0.5,
            borderRadius: `${radius.sm}px`,
            bgcolor: brand.magenta[500],
            px: 2.2,
            fontWeight: 900,
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: brand.magenta[600],
              boxShadow: 'none',
            },
          }}
        >
          {t('emptyAction')}
        </Button>
      ) : null}
    </Stack>
  )
}

export function PropertiesTable({
  properties,
  totalCount,
  onCreateProperty,
  onPropertySelect,
}: PropertiesTableProps) {
  const t = useTranslations('properties.dashboard.table')
  const filterT = useTranslations('properties.dashboard.filters')
  const emptyInventory = totalCount === 0
  const columns: GridColDef<DashboardProperty>[] = [
    {
      field: 'title',
      headerName: t('property'),
      flex: 2.2,
      minWidth: 360,
      resizable: false,
      sortable: true,
      renderCell: (params) => <PropertyIdentityCell {...params} />,
    },
    {
      field: 'type',
      headerName: t('type'),
      flex: 0.9,
      minWidth: 130,
      align: 'center',
      headerAlign: 'center',
      resizable: false,
    },
    {
      field: 'saleValue',
      headerName: t('saleValue'),
      flex: 0.9,
      minWidth: 130,
      align: 'center',
      headerAlign: 'center',
      resizable: false,
      renderCell: ({ row }) => row.pricing.sale,
    },
    {
      field: 'rentalValue',
      headerName: t('rentalValue'),
      flex: 0.9,
      minWidth: 130,
      align: 'center',
      headerAlign: 'center',
      resizable: false,
      renderCell: ({ row }) => row.pricing.rent,
    },
    {
      field: 'status',
      headerName: t('status'),
      flex: 0.8,
      minWidth: 130,
      align: 'center',
      headerAlign: 'center',
      resizable: false,
      cellClassName: 'properties-status-cell',
      renderCell: (params) => <PropertyStatusCell {...params} label={filterT(params.row.status)} />,
    },
    {
      field: 'broker',
      headerName: t('broker'),
      flex: 1,
      minWidth: 160,
      align: 'center',
      headerAlign: 'center',
      resizable: false,
    },
    {
      field: 'updatedAt',
      headerName: t('updated'),
      flex: 0.9,
      minWidth: 140,
      align: 'center',
      headerAlign: 'center',
      resizable: false,
    },
    {
      field: 'actions',
      headerName: t('actions'),
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      width: 96,
      align: 'center',
      headerAlign: 'center',
      resizable: false,
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
        autoHeight
        rows={properties}
        columns={columns}
        rowHeight={82}
        columnHeaderHeight={56}
        getRowSpacing={() => ({ top: 0, bottom: 10 })}
        disableColumnMenu
        disableColumnResize
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
        slots={{
          noRowsOverlay: () => (
            <PropertiesEmptyOverlay
              emptyInventory={emptyInventory}
              onCreateProperty={onCreateProperty}
            />
          ),
        }}
        getRowClassName={({ indexRelativeToCurrentPage }) =>
          indexRelativeToCurrentPage % 2 === 1 ? 'properties-row-alt' : 'properties-row-base'
        }
        onRowClick={(params: GridRowParams<DashboardProperty>) => onPropertySelect(params.row.id)}
        sx={{
          border: 0,
          minHeight: emptyInventory ? 360 : 'auto',
          px: 1.25,
          pb: 1,
          '& .MuiDataGrid-main': {
            overflow: 'visible',
          },
          '& .MuiDataGrid-columnHeaders': {
            bgcolor: surface.paper,
            color: brand.neutral[500],
            fontSize: 12,
            fontWeight: 900,
            textTransform: 'uppercase',
            borderBottom: '1px solid',
            borderColor: brand.neutral[100],
          },
          '& .MuiDataGrid-columnHeader': {
            px: 1.5,
          },
          '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
            outline: 'none',
          },
          '& .MuiDataGrid-columnSeparator': {
            display: 'none',
          },
          '& .properties-status-cell': {
            overflow: 'visible',
          },
          '& .MuiDataGrid-cell': {
            px: 1.5,
            borderTop: '1px solid',
            borderBottom: '1px solid',
            borderColor: alpha.graphite[8],
            outline: 'none',
          },
          '& .MuiDataGrid-cell[data-field="title"]': {
            borderLeft: '1px solid',
            borderColor: alpha.graphite[8],
            borderTopLeftRadius: `${radius.sm}px`,
            borderBottomLeftRadius: `${radius.sm}px`,
          },
          '& .MuiDataGrid-cell[data-field="actions"]': {
            borderRight: '1px solid',
            borderColor: alpha.graphite[8],
            borderTopRightRadius: `${radius.sm}px`,
            borderBottomRightRadius: `${radius.sm}px`,
          },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
            outline: 'none',
          },
          '& .MuiDataGrid-row': {
            cursor: 'pointer',
            borderRadius: `${radius.sm}px`,
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

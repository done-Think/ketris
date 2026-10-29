'use client'

import { styles, getStatusChipStyles, getGridStyles } from '../styles/properties-table.styles'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import type { GridColDef, GridRowParams } from '@mui/x-data-grid'
import { DataGrid } from '@mui/x-data-grid'
import { useTranslations } from 'next-intl'

import { dashboardPropertyStatusStyles } from '../styles/property-status.styles'
import type {
  DashboardProperty,
  PropertiesTableProps,
  PropertyIdentityCellProps,
  PropertyStatusCellProps,
  PropertiesEmptyOverlayProps,
} from '../types/dashboard-property'
import { PropertyRowActions } from './PropertyRowActions'

function PropertyIdentityCell({ row }: PropertyIdentityCellProps) {
  return (
    <Stack direction="row" alignItems="center" spacing={2} sx={styles.stack}>
      {row.imageUrl ? <Box component="img" src={row.imageUrl} alt="" sx={styles.box} /> : null}
      <Box sx={styles.box2}>
        <Typography noWrap sx={styles.typography}>
          {row.title}
        </Typography>
        <Typography noWrap sx={styles.typography2}>
          {row.address}
        </Typography>
      </Box>
    </Stack>
  )
}

function PropertyStatusCell({ row, label }: PropertyStatusCellProps) {
  const status = dashboardPropertyStatusStyles[row.status]

  return (
    <Box sx={styles.box3}>
      <Chip label={label} size="small" sx={getStatusChipStyles(status)} />
    </Box>
  )
}

function PropertiesEmptyOverlay({
  readOnly = false,
  emptyInventory,
  onCreateProperty,
}: PropertiesEmptyOverlayProps) {
  const t = useTranslations('properties.dashboard.table')
  const renterT = useTranslations('properties.dashboard.renter')

  return (
    <Stack alignItems="center" justifyContent="center" spacing={1.4} sx={styles.stack2}>
      <Box sx={styles.box4}>
        <HomeWorkOutlinedIcon sx={styles.homeWorkOutlinedIcon} />
      </Box>
      <Box>
        <Typography sx={styles.typography3}>
          {emptyInventory ? (readOnly ? renterT('emptyTitle') : t('emptyTitle')) : t('noRows')}
        </Typography>
        {emptyInventory ? (
          <Typography sx={styles.typography4}>
            {readOnly ? renterT('emptyDescription') : t('emptyDescription')}
          </Typography>
        ) : null}
      </Box>
      {emptyInventory && !readOnly ? (
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon sx={styles.addRoundedIcon} />}
          onClick={onCreateProperty}
          sx={styles.button}
        >
          {t('emptyAction')}
        </Button>
      ) : null}
    </Stack>
  )
}

export function PropertiesTable({
  readOnly = false,
  properties,
  totalCount,
  inventoryCount,
  sortModel,
  onSortChange,
  page,
  pageSize,
  onPaginationChange,
  onCreateProperty,
  onPropertySelect,
}: PropertiesTableProps) {
  const t = useTranslations('properties.dashboard.table')
  const filterT = useTranslations('properties.dashboard.filters')
  const emptyInventory = inventoryCount === 0
  const columns: GridColDef<DashboardProperty>[] = [
    {
      field: 'title',
      headerName: t('property'),
      flex: 2.2,
      minWidth: 180,
      resizable: false,
      sortable: true,
      renderCell: (params) => <PropertyIdentityCell {...params} />,
    },
    {
      field: 'type',
      headerName: t('type'),
      flex: 0.9,
      minWidth: 110,
      align: 'center',
      headerAlign: 'center',
      resizable: false,
    },
    {
      field: 'saleValue',
      headerName: t('saleValue'),
      flex: 0.9,
      minWidth: 125,
      align: 'center',
      headerAlign: 'center',
      resizable: false,
      renderCell: ({ row }) => row.pricing.sale,
    },
    {
      field: 'rentalValue',
      headerName: t('rentalValue'),
      flex: 0.9,
      minWidth: 125,
      align: 'center',
      headerAlign: 'center',
      resizable: false,
      renderCell: ({ row }) => row.pricing.rent,
    },
    {
      field: 'status',
      headerName: t('status'),
      flex: 0.8,
      minWidth: 120,
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
      minWidth: 100,
      align: 'center',
      headerAlign: 'center',
      resizable: false,
    },
    {
      field: 'updatedAt',
      headerName: t('updated'),
      flex: 0.9,
      minWidth: 110,
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
    <Box sx={styles.box5}>
      <DataGrid
        autoHeight
        rows={properties}
        columns={
          readOnly
            ? columns.filter((column) =>
                ['title', 'type', 'rentalValue', 'actions'].includes(column.field),
              )
            : columns
        }
        rowHeight={82}
        columnHeaderHeight={56}
        disableColumnMenu
        disableColumnResize
        disableRowSelectionOnClick
        sortingMode="server"
        sortModel={sortModel}
        onSortModelChange={onSortChange}
        paginationMode="server"
        paginationModel={{ page, pageSize }}
        onPaginationModelChange={onPaginationChange}
        rowCount={totalCount}
        pageSizeOptions={[5, 10, 25]}
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
              readOnly={readOnly}
              emptyInventory={emptyInventory}
              onCreateProperty={onCreateProperty}
            />
          ),
        }}
        getRowClassName={({ indexRelativeToCurrentPage }) =>
          indexRelativeToCurrentPage % 2 === 1 ? 'properties-row-alt' : 'properties-row-base'
        }
        onRowClick={(params: GridRowParams<DashboardProperty>) => onPropertySelect(params.row.id)}
        sx={getGridStyles(emptyInventory)}
      />
    </Box>
  )
}

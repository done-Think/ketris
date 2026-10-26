'use client'

import { contractStatusMessageKeys } from '../config/contract-labels'

import { styles } from '../styles/contracts-table.styles'
import { useState, type MouseEvent } from 'react'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Box,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import type { GridColDef, GridRowParams } from '@mui/x-data-grid'
import { enUS, ptBR, esES } from '@mui/x-data-grid/locales'
import { DataGrid } from '@mui/x-data-grid'
import { useLocale, useTranslations } from 'next-intl'
import { contractActionMenuOptions } from '../config/contract-ui'
import { contractStatusStyles } from '../styles/contract-status.styles'
import {
  contractIconButtonSx,
  contractMenuSlotProps,
  contractMenuTextProps,
} from '../styles/contracts-table.styles'
import type {
  ContractActionMenuIconKey,
  ContractActionsCellProps,
  ContractIdentityCellProps,
  ContractListItem,
  ContractsTableProps,
  ContractStatusCellProps,
} from '../types/contract'

function ContractIdentityCell({ row }: ContractIdentityCellProps) {
  return (
    <Stack direction="row" alignItems="center" spacing={2} sx={styles.stack}>
      <Box sx={styles.box}>
        <HomeWorkOutlinedIcon fontSize="large" aria-hidden />
      </Box>
      <Stack justifyContent="center" spacing={0.2} sx={styles.stack2}>
        <Typography noWrap sx={styles.typography}>
          {row.property}
        </Typography>
        <Typography noWrap sx={styles.typography2}>
          {row.propertyAddress}
        </Typography>
      </Stack>
    </Stack>
  )
}

function ContractStatusCell({ status }: ContractStatusCellProps) {
  const t = useTranslations('contracts.status')
  const statusStyle = contractStatusStyles[status]

  return (
    <Chip label={t(contractStatusMessageKeys[status])} size="small" sx={styles.chip(statusStyle)} />
  )
}

const contractActionMenuIcons: Record<ContractActionMenuIconKey, typeof VisibilityOutlinedIcon> = {
  summary: ArticleOutlinedIcon,
  history: HistoryOutlinedIcon,
  edit: EditNoteOutlinedIcon,
  pdf: DownloadOutlinedIcon,
}

function ContractActionsCell({ contract, onContractAction }: ContractActionsCellProps) {
  const t = useTranslations('contracts.table')
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const menuOpen = Boolean(anchorEl)

  const openMenu = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const closeMenu = () => {
    setAnchorEl(null)
  }

  return (
    <Stack direction="row" sx={styles.stack3}>
      <Tooltip title={t('actionsTooltip')}>
        <IconButton
          aria-label={t('actionsAriaLabel', { code: contract.code })}
          onClick={openMenu}
          sx={contractIconButtonSx}
        >
          <MoreHorizRoundedIcon sx={styles.moreHorizRoundedIcon} />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={closeMenu}
        onClick={(event) => event.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={contractMenuSlotProps}
      >
        {Object.entries(contractActionMenuOptions).map(([groupKey, options], groupIndex) => (
          <Box key={groupKey}>
            {groupIndex > 0 ? <Divider sx={styles.divider} /> : null}
            {options.map((option) => {
              const OptionIcon = contractActionMenuIcons[option.icon]

              return (
                <MenuItem
                  key={option.action}
                  disabled={option.action === 'edit-data' && !contract.canEdit}
                  onClick={() => {
                    onContractAction(contract, option.action)
                    closeMenu()
                  }}
                  sx={styles.menuItem}
                >
                  <ListItemIcon sx={styles.listItemIcon}>
                    <OptionIcon sx={styles.optionIcon} />
                  </ListItemIcon>
                  <ListItemText
                    primary={t(`menu.${option.action}`)}
                    primaryTypographyProps={contractMenuTextProps}
                  />
                </MenuItem>
              )
            })}
          </Box>
        ))}
      </Menu>
    </Stack>
  )
}

export function ContractsTable({
  contracts,
  totalCount,
  onContractAction,
  onContractSelect,
  readOnly = false,
  loading,
  paginationModel,
  onPaginationModelChange,
  sortModel,
  onSortModelChange,
}: ContractsTableProps) {
  const t = useTranslations('contracts.table')
  const locale = useLocale()
  const gridLocale = locale === 'en-US' ? enUS : locale === 'es-ES' ? esES : ptBR
  const columns: GridColDef<ContractListItem>[] = [
    {
      field: 'property',
      headerName: t('columns.property'),
      flex: 1.45,
      minWidth: 300,
      disableColumnMenu: true,
      hideable: false,
      renderCell: (params) => <ContractIdentityCell {...params} />,
    },
    {
      field: 'tenant',
      headerName: t('columns.tenant'),
      flex: 1,
      minWidth: 200,
      disableColumnMenu: true,
      hideable: false,
    },
    {
      field: 'amount',
      headerName: t('columns.amount'),
      flex: 0.7,
      minWidth: 140,
      disableColumnMenu: true,
      hideable: false,
    },
    {
      field: 'startDate',
      headerName: t('columns.startDate'),
      flex: 0.7,
      minWidth: 130,
      disableColumnMenu: true,
      hideable: false,
    },
    {
      field: 'endDate',
      headerName: t('columns.endDate'),
      flex: 0.8,
      minWidth: 150,
      disableColumnMenu: true,
      hideable: false,
    },
    {
      field: 'status',
      headerName: t('columns.status'),
      flex: 0.7,
      minWidth: 150,
      disableColumnMenu: true,
      hideable: false,
      renderCell: ({ row }) => <ContractStatusCell status={row.status} />,
    },
    {
      field: 'actions',
      headerName: t('columns.actions'),
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      hideable: false,
      width: 104,
      align: 'right',
      headerAlign: 'right',
      cellClassName: 'contracts-actions-column',
      headerClassName: 'contracts-actions-column',
      renderCell: ({ row }) => (
        <ContractActionsCell contract={row} onContractAction={onContractAction} />
      ),
    },
  ]

  return (
    <Box sx={styles.box2}>
      <DataGrid
        rows={contracts}
        rowCount={totalCount}
        loading={loading}
        paginationMode="server"
        sortingMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        sortModel={sortModel}
        onSortModelChange={onSortModelChange}
        columns={readOnly ? columns.filter((column) => column.field !== 'actions') : columns}
        autoHeight
        rowHeight={82}
        disableRowSelectionOnClick
        pageSizeOptions={[5, 10, 25]}
        initialState={{
          columns: {
            columnVisibilityModel: {
              property: true,
              tenant: true,
              amount: true,
              startDate: true,
              endDate: true,
              status: true,
              actions: true,
            },
          },
        }}
        localeText={{
          ...gridLocale.components.MuiDataGrid.defaultProps.localeText,
          noRowsLabel: t('noRowsLabel'),
          footerTotalRows: t('totalRows'),
          MuiTablePagination: {
            labelRowsPerPage: t('rowsPerPage'),
            getItemAriaLabel: (type) => t('paginationAria.' + type),
            labelDisplayedRows: ({ from, to }) =>
              t('displayedRows', { from, to, total: totalCount }),
          },
        }}
        onRowClick={(params: GridRowParams<ContractListItem>) => onContractSelect(params.row)}
        sx={styles.dataGrid}
      />
    </Box>
  )
}

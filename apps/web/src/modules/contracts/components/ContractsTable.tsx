'use client'

import { useState, type MouseEvent } from 'react'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
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
import { DataGrid } from '@mui/x-data-grid'

import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import { contractActionMenuOptions, contractStatusStyles } from '../config/contract-ui'
import type {
  ContractActionMenuIconKey,
  ContractActionMenuState,
  ContractActionsCellProps,
  ContractIdentityCellProps,
  ContractListItem,
  ContractsTableProps,
  ContractStatusCellProps,
} from '../types/contract'

function ContractIdentityCell({ row }: ContractIdentityCellProps) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.6} sx={{ minWidth: 0, height: '100%' }}>
      <Box
        component="img"
        src={row.propertyImageUrl}
        alt={row.property}
        sx={{
          width: 78,
          height: 78,
          borderRadius: `${radius.sm}px`,
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
      <Stack justifyContent="center" spacing={0.2} sx={{ minWidth: 0 }}>
        <Typography noWrap sx={{ color: brand.graphite[500], fontSize: 16, fontWeight: 900 }}>
          {row.property}
        </Typography>
        <Typography noWrap sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 700 }}>
          {row.propertyAddress}
        </Typography>
      </Stack>
    </Stack>
  )
}

function ContractStatusCell({ status }: ContractStatusCellProps) {
  const statusStyle = contractStatusStyles[status]

  return (
    <Chip
      label={status}
      size="small"
      sx={{
        height: 29,
        borderRadius: `${radius.sm}px`,
        bgcolor: statusStyle.bgcolor,
        color: statusStyle.color,
        fontSize: 13,
        fontWeight: 900,
      }}
    />
  )
}

const contractActionMenuIcons: Record<ContractActionMenuIconKey, typeof VisibilityOutlinedIcon> = {
  summary: ArticleOutlinedIcon,
  history: HistoryOutlinedIcon,
  edit: EditNoteOutlinedIcon,
  duplicate: ContentCopyOutlinedIcon,
  pdf: DownloadOutlinedIcon,
  draft: InsertDriveFileOutlinedIcon,
  send: SendOutlinedIcon,
  link: LinkOutlinedIcon,
}

function ContractActionsCell({ contract, onContractAction }: ContractActionsCellProps) {
  const [menuState, setMenuState] = useState<ContractActionMenuState>({
    anchorEl: null,
    contract: null,
    menu: null,
  })
  const menuOpen = Boolean(menuState.anchorEl)

  const openMenu = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setMenuState({ anchorEl: event.currentTarget, contract, menu: 'view' })
  }

  const closeMenu = () => {
    setMenuState({ anchorEl: null, contract: null, menu: null })
  }

  return (
    <Stack
      direction="row"
      sx={{
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}
    >
      <Tooltip title="Ações">
        <IconButton
          aria-label={`Ações do contrato ${contract.code}`}
          onClick={openMenu}
          sx={contractIconButtonSx}
        >
          <MoreHorizRoundedIcon sx={{ fontSize: iconSize.md }} />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={menuState.anchorEl}
        open={menuOpen}
        onClose={closeMenu}
        onClick={(event) => event.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.8,
              minWidth: 220,
              borderRadius: `${radius.sm}px`,
              border: '1px solid',
              borderColor: alpha.graphite[8],
              boxShadow: shadows.popover,
            },
          },
        }}
      >
        {Object.entries(contractActionMenuOptions).map(([groupKey, options], groupIndex) => (
          <Box key={groupKey}>
            {groupIndex > 0 ? <Divider sx={{ borderColor: alpha.graphite[8] }} /> : null}
            {options.map((option) => {
              const OptionIcon = contractActionMenuIcons[option.icon]

              return (
                <MenuItem
                  key={option.action}
                  onClick={() => {
                    if (menuState.contract) onContractAction(menuState.contract, option.action)
                    closeMenu()
                  }}
                  sx={{ minHeight: 48, gap: 1.2 }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: brand.neutral[500] }}>
                    <OptionIcon sx={{ fontSize: iconSize.sm }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={option.label}
                    primaryTypographyProps={{ fontSize: 16, fontWeight: 800 }}
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

const contractIconButtonSx = {
  width: 38,
  height: 38,
  borderRadius: `${radius.sm}px`,
  color: brand.graphite[500],
  bgcolor: brand.neutral[50],
  '&:hover': {
    color: brand.magenta[500],
    bgcolor: alpha.magenta[8],
  },
} as const

export function ContractsTable({
  contracts,
  totalCount,
  onContractAction,
  onContractSelect,
}: ContractsTableProps) {
  const columns: GridColDef<ContractListItem>[] = [
    {
      field: 'property',
      headerName: 'Imóvel',
      flex: 1.45,
      minWidth: 300,
      disableColumnMenu: true,
      hideable: false,
      renderCell: (params) => <ContractIdentityCell {...params} />,
    },
    {
      field: 'tenant',
      headerName: 'Locatário',
      flex: 1,
      minWidth: 200,
      disableColumnMenu: true,
      hideable: false,
    },
    {
      field: 'amount',
      headerName: 'Valor',
      flex: 0.7,
      minWidth: 140,
      disableColumnMenu: true,
      hideable: false,
    },
    {
      field: 'startDate',
      headerName: 'Início',
      flex: 0.7,
      minWidth: 130,
      disableColumnMenu: true,
      hideable: false,
    },
    {
      field: 'endDate',
      headerName: 'Vencimento',
      flex: 0.8,
      minWidth: 150,
      disableColumnMenu: true,
      hideable: false,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.7,
      minWidth: 150,
      disableColumnMenu: true,
      hideable: false,
      renderCell: ({ row }) => <ContractStatusCell status={row.status} />,
    },
    {
      field: 'actions',
      headerName: 'Ações',
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      hideable: false,
      width: 104,
      align: 'right',
      headerAlign: 'right',
      renderCell: ({ row }) => (
        <ContractActionsCell contract={row} onContractAction={onContractAction} />
      ),
    },
  ]

  return (
    <Box
      sx={{
        bgcolor: surface.paper,
        borderRadius: `${radius.sm}px`,
        boxShadow: shadows.crmCardCompact,
        width: '100%',
        minWidth: 0,
      }}
    >
      <DataGrid
        rows={contracts}
        columns={columns}
        autoHeight
        rowHeight={108}
        columnHeaderHeight={60}
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
          pagination: { paginationModel: { pageSize: 5 } },
        }}
        localeText={{
          noRowsLabel: 'Nenhum contrato encontrado',
          footerTotalRows: 'Total de linhas:',
          MuiTablePagination: {
            labelRowsPerPage: 'Linhas por página',
            labelDisplayedRows: ({ from, to }) => `Mostrando ${from}-${to} de ${totalCount}`,
          },
        }}
        onRowClick={(params: GridRowParams<ContractListItem>) => onContractSelect(params.row)}
        sx={{
          border: 0,
          minHeight: 500,
          color: brand.graphite[500],
          '& .MuiDataGrid-columnHeaders': {
            bgcolor: surface.app,
            color: brand.neutral[500],
            fontSize: 14,
            fontWeight: 900,
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 900,
          },
          '& .MuiDataGrid-cell': {
            borderColor: brand.neutral[100],
            fontSize: 16,
            fontWeight: 800,
            outline: 'none',
          },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
            outline: 'none',
          },
          '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
            outline: 'none',
          },
          '& .MuiDataGrid-row': {
            bgcolor: surface.paper,
            cursor: 'pointer',
          },
          '& .MuiDataGrid-row:nth-of-type(even)': {
            bgcolor: surface.app,
          },
          '& .MuiDataGrid-row:hover': {
            bgcolor: alpha.magenta[6],
          },
          '& .MuiDataGrid-footerContainer': {
            minHeight: 70,
            borderColor: brand.neutral[100],
          },
          '& .MuiTablePagination-root': {
            color: brand.graphite[500],
            fontSize: 15,
            fontWeight: 700,
          },
        }}
      />
    </Box>
  )
}

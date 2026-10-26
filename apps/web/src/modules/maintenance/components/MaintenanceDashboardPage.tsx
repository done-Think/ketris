'use client'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import LinkRoundedIcon from '@mui/icons-material/LinkRounded'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Menu,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import {
  DashboardHeaderActionButton,
  DashboardNotificationsButton,
  DashboardPageHeader,
} from '@shared/components/layout'
import { alpha, brand, radius, surface } from '@shared/theme/tokens'
import { MaintenanceCreateTicketDialog } from './MaintenanceCreateTicketDialog'
import { MaintenanceLinksDialog } from './MaintenanceLinksDialog'
import { MaintenanceStatusFilters } from './MaintenanceStatusFilters'
import { MetricCard } from './MetricCard'
import { useMaintenanceDashboard } from '../hooks/use-maintenance-dashboard'
import { MaintenanceTicketsTable } from './MaintenanceTicketsTable'
import type { ApiMaintenanceTicketCategory } from '../types/service'
import { MAINTENANCE_CATEGORIES } from '../utils/maintenance-category'

export function MaintenanceDashboardPage() {
  const {
    t,
    session,
    filters,
    setSearch,
    setActiveFilter,
    setPropertyFilter,
    setCategoryFilter,
    setArchived,
    setRowsPerPage,
    setCurrentPage,
    dialog,
    openDialog,
    closeDialog,
    menu,
    openMenu,
    closeMenu,
    editingTicketId,
    properties,
    pagedTickets,
    totalCount,
    metrics,
    getFilterCount,
    handleCreateTicket,
    initialValues,
    handleSaveTicket,
    handleDeleteTicket,
  } = useMaintenanceDashboard()
  const menuTicket = pagedTickets.find((ticket) => ticket.id === menu?.ticketId)
  const headerActions = (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      useFlexGap
      gap={1.2}
      sx={{
        width: { xs: '100%', lg: 'auto' },
        alignItems: { sm: 'center' },
        flexWrap: { sm: 'wrap' },
        justifyContent: { sm: 'flex-end' },
      }}
    >
      <TextField
        value={filters.search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t('search')}
        size="small"
        sx={compactFieldSx}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 16, color: brand.neutral[400] }} />
              </InputAdornment>
            ),
          },
        }}
      />
      <TextField
        select
        value={filters.propertyId}
        onChange={(event) => setPropertyFilter(event.target.value)}
        size="small"
        sx={{
          ...compactFieldSx,
          width: { xs: '100%', sm: 180 },
          display: { xs: 'none', md: 'block' },
          '& .MuiSelect-select': { pr: 4.5 },
        }}
      >
        <MenuItem value="all">
          <Stack direction="row" spacing={0.7} alignItems="center">
            <ApartmentOutlinedIcon sx={{ fontSize: 17 }} />
            <span>{t('allProperties')}</span>
          </Stack>
        </MenuItem>
        {properties.map((property) => (
          <MenuItem key={property.id} value={property.id}>
            {property.title}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        value={filters.category}
        onChange={(event) =>
          setCategoryFilter(event.target.value as ApiMaintenanceTicketCategory | 'all')
        }
        size="small"
        aria-label={t('filterDialog.category')}
        sx={{
          ...compactFieldSx,
          width: { xs: '100%', sm: 170 },
          display: { xs: 'none', md: 'block' },
        }}
      >
        <MenuItem value="all">{t('allCategories')}</MenuItem>
        {MAINTENANCE_CATEGORIES.map((category) => (
          <MenuItem key={category} value={category}>
            {t(`categories.${category}`)}
          </MenuItem>
        ))}
      </TextField>
      <Button
        variant="outlined"
        startIcon={<FilterListRoundedIcon sx={{ fontSize: 16 }} />}
        onClick={() => openDialog({ kind: 'filters' })}
        aria-label={t('filterDialog.open')}
        sx={{
          display: { xs: 'inline-flex', md: 'none' },
          height: { xs: 40, sm: 32 },
          px: 1.5,
          borderRadius: `${radius.sm}px`,
          fontSize: 12,
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
      >
        {t('filterDialog.open')}
      </Button>
      <DashboardHeaderActionButton
        startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
        onClick={() => openDialog({ kind: 'create' })}
      >
        {t('newTicket')}
      </DashboardHeaderActionButton>
      {session?.role === 'OWNER' && (
        <>
          <Button startIcon={<LinkRoundedIcon />} onClick={() => openDialog({ kind: 'links' })}>
            {t('links.title')}
          </Button>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={filters.archived ? 'archived' : 'active'}
            onChange={(_, value) => {
              if (value) setArchived(value === 'archived')
            }}
          >
            <ToggleButton value="active">{t('activeTickets')}</ToggleButton>
            <ToggleButton value="archived">{t('archivedTickets')}</ToggleButton>
          </ToggleButtonGroup>
        </>
      )}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <DashboardNotificationsButton />
      </Box>
    </Stack>
  )

  return (
    <Box sx={{ width: '100%', p: 3.5 }}>
      <Stack spacing={{ xs: 2, md: 2.7 }}>
        <DashboardPageHeader
          title={t('title')}
          subtitle={t(session?.role === 'RENTER' ? 'renter.subtitle' : 'subtitle')}
          actions={headerActions}
          sx={{
            flexWrap: { md: 'wrap' },
            rowGap: { md: 1.6 },
            '& > :first-of-type': { minWidth: { md: 240 } },
            '& > :last-of-type': { ml: { md: 'auto' }, maxWidth: '100%' },
          }}
        />
        <MaintenanceStatusFilters
          activeFilter={filters.status}
          getFilterCount={getFilterCount}
          onChange={setActiveFilter}
          isDesktop
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(3, minmax(0, 1fr))',
              sm: 'repeat(3, minmax(0, 1fr))',
            },
            gap: { xs: 0.8, sm: 1.8 },
          }}
        >
          {metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={t(`metrics.${metric.label}`)}
              value={metric.value}
              tone={metric.label}
            />
          ))}
        </Box>
        <MaintenanceTicketsTable
          pagedTickets={pagedTickets}
          totalCount={totalCount}
          currentPage={filters.page}
          rowsPerPage={filters.rowsPerPage}
          setCurrentPage={setCurrentPage}
          onRowsPerPageChange={setRowsPerPage}
          onOpenMenu={openMenu}
        />
      </Stack>
      <MaintenanceCreateTicketDialog
        open={dialog?.kind === 'create' || dialog?.kind === 'edit'}
        onClose={closeDialog}
        onCreate={editingTicketId ? handleSaveTicket : handleCreateTicket}
        initialValues={initialValues}
        mode={editingTicketId ? 'edit' : 'create'}
      />
      {session?.role === 'OWNER' && (
        <MaintenanceLinksDialog open={dialog?.kind === 'links'} onClose={closeDialog} />
      )}
      <Dialog
        open={dialog?.kind === 'filters'}
        onClose={closeDialog}
        fullWidth
        maxWidth="xs"
        aria-labelledby="maintenance-filters-title"
        slotProps={{
          paper: {
            sx: {
              borderRadius: `${radius.sm}px`,
              maxHeight: 'calc(100% - 32px)',
            },
          },
        }}
      >
        <DialogTitle
          id="maintenance-filters-title"
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
        >
          {t('filterDialog.title')}
          <IconButton aria-label={t('filterDialog.close')} onClick={closeDialog}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField
              select
              label={t('filterDialog.property')}
              value={filters.propertyId}
              onChange={(event) => setPropertyFilter(event.target.value)}
              fullWidth
              sx={compactFieldSx}
            >
              <MenuItem value="all">{t('allProperties')}</MenuItem>
              {properties.map((property) => (
                <MenuItem key={property.id} value={property.id}>
                  {property.title}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={t('filterDialog.category')}
              value={filters.category}
              onChange={(event) =>
                setCategoryFilter(event.target.value as ApiMaintenanceTicketCategory | 'all')
              }
              fullWidth
              sx={compactFieldSx}
            >
              <MenuItem value="all">{t('allCategories')}</MenuItem>
              {MAINTENANCE_CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>
                  {t(`categories.${category}`)}
                </MenuItem>
              ))}
            </TextField>
            <MaintenanceStatusFilters
              activeFilter={filters.status}
              direction="column"
              getFilterCount={getFilterCount}
              onChange={setActiveFilter}
            />
          </Stack>
        </DialogContent>
      </Dialog>
      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={closeMenu}>
        {menuTicket?.permissions?.edit && (
          <MenuItem
            onClick={() => {
              openDialog({ kind: 'edit', ticketId: menuTicket.id })
              closeMenu()
            }}
          >
            <EditOutlinedIcon sx={{ mr: 1, fontSize: 18 }} />
            {t('actions.edit')}
          </MenuItem>
        )}
        {menuTicket?.permissions?.delete && (
          <MenuItem
            onClick={() => {
              openDialog({ kind: 'delete', ticketId: menuTicket.id })
              closeMenu()
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteOutlineRoundedIcon sx={{ mr: 1, fontSize: 18 }} />
            {t('actions.delete')}
          </MenuItem>
        )}
      </Menu>
      <Dialog open={dialog?.kind === 'delete'} onClose={closeDialog}>
        <DialogTitle>{t('actions.deleteTitle')}</DialogTitle>
        <DialogContent>{t('actions.deleteDescription')}</DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>{t('createDialog.cancel')}</Button>
          <Button color="error" variant="contained" onClick={handleDeleteTicket}>
            {t('actions.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
const compactFieldSx = {
  width: { xs: '100%', sm: 200 },
  '& .MuiInputBase-root': {
    height: { xs: 40, sm: 32 },
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    fontSize: 12,
    color: brand.neutral[600],
  },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha.graphite[8] },
} as const

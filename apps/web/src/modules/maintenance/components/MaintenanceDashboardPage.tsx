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

export function MaintenanceDashboardPage() {
  const {
    t,
    session,
    activeFilter,
    search,
    setSearch,
    propertyFilter,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isFiltersDialogOpen,
    setIsFiltersDialogOpen,
    editingTicketId,
    setEditingTicketId,
    deletingTicketId,
    setDeletingTicketId,
    menuAnchor,
    setMenuAnchor,
    menuTicketId,
    setMenuTicketId,
    archived,
    setArchived,
    linksOpen,
    setLinksOpen,
    properties,
    pagedTickets,
    totalCount,
    metrics,
    getFilterCount,
    handleActiveFilterChange,
    handlePropertyFilterChange,
    handleCreateTicket,
    closeMenu,
    initialValues,
    handleSaveTicket,
    handleDeleteTicket,
  } = useMaintenanceDashboard()
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
        value={search}
        onChange={(event) => {
          setSearch(event.target.value)
          setCurrentPage(1)
        }}
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
        value={propertyFilter}
        onChange={(event) => handlePropertyFilterChange(event.target.value)}
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
      <Button
        variant="outlined"
        startIcon={<FilterListRoundedIcon sx={{ fontSize: 16 }} />}
        onClick={() => setIsFiltersDialogOpen(true)}
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
        onClick={() => setIsCreateDialogOpen(true)}
      >
        {t('newTicket')}
      </DashboardHeaderActionButton>
      {session?.role === 'ADMIN' && (
        <>
          <Button startIcon={<LinkRoundedIcon />} onClick={() => setLinksOpen(true)}>
            {t('links.title')}
          </Button>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={archived ? 'archived' : 'active'}
            onChange={(_, value) => {
              if (value) {
                setArchived(value === 'archived')
                setCurrentPage(1)
              }
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
          activeFilter={activeFilter}
          getFilterCount={getFilterCount}
          onChange={handleActiveFilterChange}
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
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          setCurrentPage={setCurrentPage}
          onRowsPerPageChange={(rows) => {
            setRowsPerPage(rows)
            setCurrentPage(1)
          }}
          onOpenMenu={(anchor, id) => {
            setMenuAnchor(anchor)
            setMenuTicketId(id)
          }}
        />
      </Stack>
      <MaintenanceCreateTicketDialog
        open={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false)
          setEditingTicketId(null)
        }}
        onCreate={editingTicketId ? handleSaveTicket : handleCreateTicket}
        initialValues={initialValues}
        mode={editingTicketId ? 'edit' : 'create'}
      />
      {session?.role === 'ADMIN' && (
        <MaintenanceLinksDialog open={linksOpen} onClose={() => setLinksOpen(false)} />
      )}
      <Dialog
        open={isFiltersDialogOpen}
        onClose={() => setIsFiltersDialogOpen(false)}
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
          <IconButton
            aria-label={t('filterDialog.close')}
            onClick={() => setIsFiltersDialogOpen(false)}
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField
              select
              label={t('filterDialog.property')}
              value={propertyFilter}
              onChange={(event) => handlePropertyFilterChange(event.target.value)}
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
            <MaintenanceStatusFilters
              activeFilter={activeFilter}
              direction="column"
              getFilterCount={getFilterCount}
              onChange={handleActiveFilterChange}
            />
          </Stack>
        </DialogContent>
      </Dialog>
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        {pagedTickets.find((ticket) => ticket.id === menuTicketId)?.permissions?.edit && (
          <MenuItem
            onClick={() => {
              setEditingTicketId(menuTicketId)
              setIsCreateDialogOpen(Boolean(menuTicketId))
              closeMenu()
            }}
          >
            <EditOutlinedIcon sx={{ mr: 1, fontSize: 18 }} />
            {t('actions.edit')}
          </MenuItem>
        )}
        {pagedTickets.find((ticket) => ticket.id === menuTicketId)?.permissions?.delete && (
          <MenuItem
            onClick={() => {
              setDeletingTicketId(menuTicketId)
              closeMenu()
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteOutlineRoundedIcon sx={{ mr: 1, fontSize: 18 }} />
            {t('actions.delete')}
          </MenuItem>
        )}
      </Menu>
      <Dialog open={Boolean(deletingTicketId)} onClose={() => setDeletingTicketId(null)}>
        <DialogTitle>{t('actions.deleteTitle')}</DialogTitle>
        <DialogContent>{t('actions.deleteDescription')}</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingTicketId(null)}>{t('createDialog.cancel')}</Button>
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

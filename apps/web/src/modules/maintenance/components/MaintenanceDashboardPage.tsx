'use client'

import * as maintenanceStyles from '../styles/maintenance-dashboard-page.styles'

import { MaintenanceProvidersDialog } from './MaintenanceProvidersDialog'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded'
import LinkRoundedIcon from '@mui/icons-material/LinkRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  LinearProgress,
  Menu,
  MenuItem,
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
import { useMaintenanceDashboard } from '../hooks/use-maintenance-dashboard'
import { MaintenanceCreateTicketDialog } from './MaintenanceCreateTicketDialog'
import { MaintenanceLinksDialog } from './MaintenanceLinksDialog'
import { MaintenanceStatusFilters } from './MaintenanceStatusFilters'
import { MaintenanceTicketsTable } from './MaintenanceTicketsTable'
import { MetricCard } from './MetricCard'

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
    isFiltersDialogOpen,
    editingTicketId,
    deletingTicketId,
    menuAnchor,
    menuTicketId,
    archived,
    setArchived,
    linksOpen,
    providersOpen,
    openDialog,
    closeDialog,
    openMenu,
    properties,
    pagedTickets,
    totalCount,
    metrics,
    isLoading,
    isError,
    retry,
    getFilterCount,
    handleActiveFilterChange,
    handlePropertyFilterChange,
    handleCreateTicket,
    closeMenu,
    initialValues,
    isEditError,
    retryEdit,
    handleSaveTicket,
    handleDeleteTicket,
  } = useMaintenanceDashboard()
  const headerActions = (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      useFlexGap
      gap={1.2}
      sx={maintenanceStyles.stackSx}
    >
      <TextField
        value={search}
        onChange={(event) => {
          setSearch(event.target.value)
          setCurrentPage(1)
        }}
        placeholder={t('search')}
        size="small"
        sx={maintenanceStyles.compactFieldSx}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={maintenanceStyles.searchRoundedIconSx} />
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
        sx={maintenanceStyles.extraStyleSx2}
      >
        <MenuItem value="all">
          <Stack direction="row" spacing={0.7} alignItems="center">
            <ApartmentOutlinedIcon sx={maintenanceStyles.apartmentOutlinedIconSx} />
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
        startIcon={<FilterListRoundedIcon sx={maintenanceStyles.filterListRoundedIconSx} />}
        onClick={() => openDialog({ kind: 'filters' })}
        aria-label={t('filterDialog.open')}
        sx={maintenanceStyles.buttonSx}
      >
        {t('filterDialog.open')}
      </Button>
      <DashboardHeaderActionButton
        startIcon={<AddRoundedIcon sx={maintenanceStyles.filterListRoundedIconSx} />}
        onClick={() => openDialog({ kind: 'create' })}
      >
        {t('newTicket')}
      </DashboardHeaderActionButton>
      {session?.role === 'OWNER' && (
        <>
          <Button startIcon={<LinkRoundedIcon />} onClick={() => openDialog({ kind: 'links' })}>
            {t('links.title')}
          </Button>
          <Button onClick={() => openDialog({ kind: 'providers' })}>{t('providers.title')}</Button>
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
      <Box sx={maintenanceStyles.boxSx}>
        <DashboardNotificationsButton />
      </Box>
    </Stack>
  )

  return (
    <Box sx={maintenanceStyles.boxSx2}>
      <Stack spacing={{ xs: 2, md: 2.7 }}>
        <DashboardPageHeader
          title={t('title')}
          subtitle={t(session?.role === 'RENTER' ? 'renter.subtitle' : 'subtitle')}
          actions={headerActions}
          sx={maintenanceStyles.dashboardPageHeaderSx}
        />
        <MaintenanceStatusFilters
          activeFilter={activeFilter}
          getFilterCount={getFilterCount}
          onChange={handleActiveFilterChange}
          isDesktop
        />
        <Box sx={maintenanceStyles.boxSx3}>
          {metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={t(`metrics.${metric.label}`)}
              value={metric.value}
              tone={metric.label}
            />
          ))}
        </Box>
        {isLoading && <LinearProgress aria-label={t('listLoading')} />}
        {isError && (
          <Alert severity="error" action={<Button onClick={() => retry()}>{t('retry')}</Button>}>
            {t('listError')}
          </Alert>
        )}
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
            openMenu(anchor, id)
          }}
        />
      </Stack>
      <MaintenanceCreateTicketDialog
        key={`${session?.tenantId}:${session?.user?.id}:${editingTicketId ?? 'new'}`}
        open={isCreateDialogOpen}
        onClose={() => {
          closeDialog()
        }}
        onCreate={editingTicketId ? handleSaveTicket : handleCreateTicket}
        initialValues={initialValues}
        loadError={isEditError}
        onRetry={retryEdit}
        mode={editingTicketId ? 'edit' : 'create'}
      />
      {session?.role === 'OWNER' && (
        <MaintenanceLinksDialog open={linksOpen} onClose={() => closeDialog()} />
      )}
      {session?.role === 'OWNER' && (
        <MaintenanceProvidersDialog
          key={`${session.tenantId}:${session.user?.id}`}
          open={providersOpen}
          onClose={closeDialog}
        />
      )}
      <Dialog
        open={isFiltersDialogOpen}
        onClose={() => closeDialog()}
        fullWidth
        maxWidth="xs"
        aria-labelledby="maintenance-filters-title"
        slotProps={{
          paper: {
            sx: maintenanceStyles.extraStyleSx1,
          },
        }}
      >
        <DialogTitle id="maintenance-filters-title" sx={maintenanceStyles.dialogTitleSx}>
          {t('filterDialog.title')}
          <IconButton aria-label={t('filterDialog.close')} onClick={() => closeDialog()}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={maintenanceStyles.stackSx2}>
            <TextField
              select
              label={t('filterDialog.property')}
              value={propertyFilter}
              onChange={(event) => handlePropertyFilterChange(event.target.value)}
              fullWidth
              sx={maintenanceStyles.compactFieldSx}
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
              if (menuTicketId) openDialog({ kind: 'edit', ticketId: menuTicketId })
              closeMenu()
            }}
          >
            <EditOutlinedIcon sx={maintenanceStyles.editOutlinedIconSx} />
            {t('actions.edit')}
          </MenuItem>
        )}
        {pagedTickets.find((ticket) => ticket.id === menuTicketId)?.permissions?.delete && (
          <MenuItem
            onClick={() => {
              if (menuTicketId) {
                openDialog({ kind: 'delete', ticketId: menuTicketId })
              }
              closeMenu()
            }}
            sx={maintenanceStyles.menuItemSx}
          >
            <DeleteOutlineRoundedIcon sx={maintenanceStyles.editOutlinedIconSx} />
            {t('actions.delete')}
          </MenuItem>
        )}
      </Menu>
      <Dialog open={Boolean(deletingTicketId)} onClose={() => closeDialog()}>
        <DialogTitle>{t('actions.deleteTitle')}</DialogTitle>
        <DialogContent>{t('actions.deleteDescription')}</DialogContent>
        <DialogActions>
          <Button onClick={() => closeDialog()}>{t('createDialog.cancel')}</Button>
          <Button color="error" variant="contained" onClick={handleDeleteTicket}>
            {t('actions.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

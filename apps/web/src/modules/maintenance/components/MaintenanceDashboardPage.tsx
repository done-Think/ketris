'use client'

import type { MaintenanceStatusStyle } from '../types/maintenance'

import { useMemo, useState } from 'react'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import LinkRoundedIcon from '@mui/icons-material/LinkRounded'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Menu,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import dayjs from 'dayjs'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import { Link } from '@/i18n/navigation'
import {
  DashboardHeaderActionButton,
  DashboardNotificationsButton,
  DashboardPageHeader,
  DashboardTablePagination,
} from '@shared/components/layout'

import {
  useCreateMaintenanceTicket,
  useDeleteMaintenanceTicket,
  useMaintenanceTicket,
  useMaintenanceTickets,
  useUpdateMaintenanceTicket,
  useMaintenanceOptions,
} from '../hooks/use-maintenance'
import type {
  MaintenanceCreateTicketFormValues,
  MaintenanceFilter,
  MaintenanceMetric,
  MaintenancePriority,
  MaintenanceStatus,
} from '../types/maintenance'
import {
  buildUpdateMaintenanceTicketPayload,
  mapMaintenancePriorityToApi,
  mapMaintenanceStatusToApi,
  mapMaintenanceTicketListItemFromApi,
  mapMaintenanceTicketToFormValues,
} from '../utils/maintenance-adapter'
import { errorMessage } from '../utils/error-message'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'
import { MaintenanceCreateTicketDialog } from './MaintenanceCreateTicketDialog'
import { MaintenanceLinksDialog } from './MaintenanceLinksDialog'
import { MaintenanceStatusFilters } from './MaintenanceStatusFilters'
import { MetricCard } from './MetricCard'

const statusStyles: Record<MaintenanceStatus, MaintenanceStatusStyle> = {
  inProgress: { bgcolor: '#FFF2CC', color: '#D98900' },
  open: { bgcolor: '#E8F1FF', color: '#2877E8' },
  resolved: { bgcolor: '#E5F8ED', color: '#12A150' },
  closed: { bgcolor: '#EFF1F4', color: '#617086' },
  pendingConfirmation: { bgcolor: '#E8F1FF', color: '#2877E8' },
  contested: { bgcolor: '#FDE8EB', color: '#B42338' },
  cancelled: { bgcolor: '#EFF1F4', color: '#617086' },
}
const priorityColors: Record<MaintenancePriority, string> = {
  urgent: brand.semantic.error,
  high: '#F59E0B',
  normal: brand.neutral[400],
}

const ticketsPerPage = 5

export function MaintenanceDashboardPage() {
  const t = useTranslations('dashboard.maintenance')
  const { enqueueSnackbar } = useSnackbar()
  const { data: session } = useSession()
  const tenantId = session?.tenantId
  const [activeFilter, setActiveFilter] = useState<'all' | MaintenanceStatus | 'urgent'>('all')
  const [search, setSearch] = useState('')
  const [propertyFilter, setPropertyFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(ticketsPerPage)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isFiltersDialogOpen, setIsFiltersDialogOpen] = useState(false)
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null)
  const [deletingTicketId, setDeletingTicketId] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [menuTicketId, setMenuTicketId] = useState<string | null>(null)
  const [archived, setArchived] = useState(false)
  const [linksOpen, setLinksOpen] = useState(false)

  const ticketsQuery = useMaintenanceTickets(tenantId, {
    archived,
    status:
      activeFilter !== 'all' && activeFilter !== 'urgent'
        ? mapMaintenanceStatusToApi(activeFilter)
        : undefined,
    priority: activeFilter === 'urgent' ? mapMaintenancePriorityToApi('urgent') : undefined,
    propertyId: propertyFilter === 'all' ? undefined : propertyFilter,
    search: search.trim() || undefined,
    page: currentPage,
    pageSize: rowsPerPage,
  })
  // Fetch pulled separately (unfiltered, capped at the API's max pageSize) only to compute the
  // metric cards and the per-tab counts, which need totals across all tickets, not just the
  // current page/filter.
  const allTicketsQuery = useMaintenanceTickets(tenantId, { pageSize: 100, archived })
  const optionsQuery = useMaintenanceOptions()
  const editTicketQuery = useMaintenanceTicket(tenantId, editingTicketId)
  const createMutation = useCreateMaintenanceTicket(tenantId)
  const updateMutation = useUpdateMaintenanceTicket(tenantId)
  const deleteMutation = useDeleteMaintenanceTicket(tenantId)

  const properties = [
    ...new Map(
      (optionsQuery.data?.contracts ?? []).map((contract) => [
        contract.propertyId,
        { id: contract.propertyId, title: contract.propertyTitle },
      ]),
    ).values(),
  ]
  const pagedTickets = useMemo(
    () => (ticketsQuery.data?.items ?? []).map(mapMaintenanceTicketListItemFromApi),
    [ticketsQuery.data],
  )
  const allTickets = useMemo(
    () => (allTicketsQuery.data?.items ?? []).map(mapMaintenanceTicketListItemFromApi),
    [allTicketsQuery.data],
  )
  const totalCount = ticketsQuery.data?.totalCount ?? 0

  const metrics = useMemo<MaintenanceMetric[]>(() => {
    const openCount = allTickets.filter((ticket) => ticket.status === 'open').length
    const urgentCount = allTickets.filter((ticket) => ticket.priority === 'urgent').length
    const resolvedItems = (allTicketsQuery.data?.items ?? []).filter((item) => item.resolvedAt)
    const averageResolutionDays =
      resolvedItems.length > 0
        ? resolvedItems.reduce(
            (total, item) =>
              total + dayjs(item.resolvedAt).diff(dayjs(item.createdAt), 'day', true),
            0,
          ) / resolvedItems.length
        : null

    const result: MaintenanceMetric[] = [
      { label: 'open', value: String(openCount) },
      { label: 'urgent', value: String(urgentCount) },
    ]

    if (averageResolutionDays !== null) {
      result.push({
        label: 'averageResolution',
        value: t('metrics.averageResolutionUnit', { days: averageResolutionDays.toFixed(1) }),
      })
    }

    return result
  }, [t, allTicketsQuery.data, allTickets])

  function getFilterCount(value: MaintenanceFilter['value']) {
    return allTickets.filter(
      (ticket) =>
        value === 'all' ||
        (value === 'urgent' ? ticket.priority === 'urgent' : ticket.status === value),
    ).length
  }

  function handleActiveFilterChange(value: MaintenanceFilter['value']) {
    setActiveFilter(value)
    setCurrentPage(1)
  }

  function handlePropertyFilterChange(value: string) {
    setPropertyFilter(value)
    setCurrentPage(1)
  }

  async function handleCreateTicket(values: MaintenanceCreateTicketFormValues) {
    try {
      await createMutation.mutateAsync(values)
      enqueueSnackbar(t('notifications.createSuccess'), { variant: 'success' })
      setCurrentPage(1)
      setIsCreateDialogOpen(false)
      return true
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('notifications.createError')), { variant: 'error' })
      return false
    }
  }

  function closeMenu() {
    setMenuAnchor(null)
    setMenuTicketId(null)
  }

  const initialValues =
    editingTicketId && editTicketQuery.data
      ? mapMaintenanceTicketToFormValues(editTicketQuery.data)
      : undefined

  async function handleSaveTicket(values: MaintenanceCreateTicketFormValues) {
    if (!editingTicketId) return
    try {
      await updateMutation.mutateAsync({
        id: editingTicketId,
        payload: buildUpdateMaintenanceTicketPayload(values),
      })
      enqueueSnackbar(t('notifications.updateSuccess'), { variant: 'success' })
      setEditingTicketId(null)
      setIsCreateDialogOpen(false)
      return true
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('notifications.updateError')), { variant: 'error' })
      return false
    }
  }

  async function handleDeleteTicket() {
    if (!deletingTicketId) return
    try {
      await deleteMutation.mutateAsync(deletingTicketId)
      enqueueSnackbar(t('notifications.deleteSuccess'), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('notifications.deleteError')), { variant: 'error' })
    } finally {
      setDeletingTicketId(null)
    }
  }

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
        <TableContainer
          sx={{
            borderRadius: `${radius.sm}px`,
            bgcolor: surface.paper,
            boxShadow: shadows.crmCardCompact,
            overflowX: 'auto',
          }}
        >
          <Table size="small" sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                {[
                  'ticket',
                  'property',
                  'category',
                  'priority',
                  'tenant',
                  'openedAt',
                  'status',
                  'actions',
                ].map((column) => (
                  <TableCell
                    key={column}
                    align={column === 'actions' ? 'center' : undefined}
                    sx={headerCellSx}
                  >
                    {t(`columns.${column}`)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedTickets.map((ticket, index) => (
                <TableRow
                  key={ticket.id}
                  sx={{
                    bgcolor: index % 2 === 1 ? surface.app : surface.paper,
                    transition: 'background-color 160ms ease',
                    '&:hover': { bgcolor: alpha.graphite[6] },
                    '&:last-child td': { borderBottom: 0 },
                  }}
                >
                  <TableCell sx={{ ...bodyCellSx, color: 'primary.main', fontWeight: 900 }}>
                    {ticket.id}
                  </TableCell>
                  <TableCell sx={{ ...bodyCellSx, fontWeight: 900 }}>{ticket.property}</TableCell>
                  <TableCell sx={bodyCellSx}>{ticket.category}</TableCell>
                  <TableCell sx={bodyCellSx}>
                    <Stack direction="row" spacing={0.65} alignItems="center">
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: priorityColors[ticket.priority],
                        }}
                      />
                      <span>{t(`priorities.${ticket.priority}`)}</span>
                    </Stack>
                  </TableCell>
                  <TableCell sx={bodyCellSx}>{ticket.tenant}</TableCell>
                  <TableCell sx={{ ...bodyCellSx, color: brand.neutral[400] }}>
                    {ticket.openedAt}
                  </TableCell>
                  <TableCell sx={bodyCellSx}>
                    <Chip
                      label={t(`statuses.${ticket.status}`)}
                      size="small"
                      sx={{
                        height: 22,
                        bgcolor: statusStyles[ticket.status].bgcolor,
                        color: statusStyles[ticket.status].color,
                        fontSize: 11,
                        fontWeight: 900,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={bodyCellSx} align="center">
                    <Stack direction="row" spacing={0.4} justifyContent="center">
                      <IconButton
                        component={Link}
                        href={{
                          pathname: '/dashboard/maintenance/[id]',
                          params: { id: ticket.id },
                        }}
                        aria-label={t('viewTicket', { ticket: ticket.id })}
                        size="small"
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: `${radius.sm}px`,
                          bgcolor: surface.app,
                          color: brand.graphite[500],
                        }}
                      >
                        <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      {(ticket.permissions?.edit || ticket.permissions?.delete) && (
                        <IconButton
                          aria-label={t('actions.menu', { ticket: ticket.id })}
                          size="small"
                          onClick={(event) => {
                            setMenuAnchor(event.currentTarget)
                            setMenuTicketId(ticket.id)
                          }}
                          sx={{ width: 30, height: 30, color: brand.graphite[500] }}
                        >
                          <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {pagedTickets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={bodyCellSx}>
                    {t('empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <DashboardTablePagination
            count={totalCount}
            page={currentPage}
            rowsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={(nextRowsPerPage) => {
              setRowsPerPage(nextRowsPerPage)
              setCurrentPage(1)
            }}
          />
        </TableContainer>
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
const headerCellSx = {
  height: 40,
  px: 1.75,
  py: 0.8,
  bgcolor: surface.app,
  borderColor: brand.neutral[100],
  color: brand.neutral[600],
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: '.07em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
} as const
const bodyCellSx = {
  height: 54,
  px: 1.75,
  py: 0.8,
  borderColor: brand.neutral[100],
  color: brand.neutral[600],
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: 'nowrap',
} as const

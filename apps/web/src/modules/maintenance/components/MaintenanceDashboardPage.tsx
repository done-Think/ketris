'use client'

import { useMemo, useState } from 'react'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
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
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import {
  maintenanceFilters,
  maintenanceMetrics,
  maintenanceTickets,
} from '../data/maintenance-tickets'
import type { MaintenancePriority, MaintenanceStatus } from '../types/maintenance'
import type { MaintenanceCreateTicketFormValues, MaintenanceTicket } from '../types/maintenance'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'
import { MaintenanceCreateTicketDialog } from './MaintenanceCreateTicketDialog'

const statusStyles: Record<MaintenanceStatus, { bgcolor: string; color: string }> = {
  inProgress: { bgcolor: '#FFF2CC', color: '#D98900' },
  open: { bgcolor: '#E8F1FF', color: '#2877E8' },
  resolved: { bgcolor: '#E5F8ED', color: '#12A150' },
  closed: { bgcolor: '#EFF1F4', color: '#617086' },
}
const priorityColors: Record<MaintenancePriority, string> = {
  urgent: brand.semantic.error,
  high: '#F59E0B',
  normal: brand.neutral[400],
}

export function MaintenanceDashboardPage() {
  const t = useTranslations('dashboard.maintenance')
  const [activeFilter, setActiveFilter] = useState<'all' | MaintenanceStatus | 'urgent'>('all')
  const [search, setSearch] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<MaintenanceTicket | null>(null)
  const [deletingTicket, setDeletingTicket] = useState<MaintenanceTicket | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [menuTicket, setMenuTicket] = useState<MaintenanceTicket | null>(null)
  const [tickets, setTickets] = useState<readonly MaintenanceTicket[]>(maintenanceTickets)
  const filteredTickets = useMemo(
    () =>
      tickets.filter((ticket) => {
        const matchesFilter =
          activeFilter === 'all' ||
          (activeFilter === 'urgent'
            ? ticket.priority === 'urgent'
            : ticket.status === activeFilter)
        const normalized = search.trim().toLocaleLowerCase('pt-BR')
        return (
          matchesFilter &&
          (!normalized ||
            [ticket.id, ticket.property, ticket.category, ticket.tenant].some((value) =>
              value.toLocaleLowerCase('pt-BR').includes(normalized),
            ))
        )
      }),
    [activeFilter, search, tickets],
  )

  function getFilterCount(filter: (typeof maintenanceFilters)[number]) {
    const matchesFilter = (ticket: MaintenanceTicket) =>
      filter.value === 'all' ||
      (filter.value === 'urgent' ? ticket.priority === 'urgent' : ticket.status === filter.value)
    return (
      filter.count +
      tickets.filter(matchesFilter).length -
      maintenanceTickets.filter(matchesFilter).length
    )
  }

  function handleCreateTicket(values: MaintenanceCreateTicketFormValues) {
    const property = maintenanceProperties.find((option) => option.id === values.propertyId)
    if (!property) return

    const nextNumber = Math.max(...tickets.map((ticket) => Number(ticket.id.slice(-4)))) + 1
    const ticket: MaintenanceTicket = {
      id: `#MNT-2025-${String(nextNumber).padStart(4, '0')}`,
      property: property.label,
      category: values.category,
      priority: values.priority,
      tenant: property.tenant,
      openedAt: new Intl.DateTimeFormat('pt-BR').format(new Date()),
      status: 'open',
      title: values.title,
      description: values.description,
      estimatedCost: values.estimatedCost,
    }

    setTickets((currentTickets) => [ticket, ...currentTickets])
    setIsCreateDialogOpen(false)
  }

  function closeMenu() {
    setMenuAnchor(null)
    setMenuTicket(null)
  }

  function getFormValues(ticket: MaintenanceTicket): MaintenanceCreateTicketFormValues {
    return {
      propertyId:
        maintenanceProperties.find((property) => property.label === ticket.property)?.id ?? '',
      category: ticket.category,
      priority: ticket.priority,
      title: ticket.title ?? ticket.id,
      description:
        ticket.description ?? `Chamado de ${ticket.category.toLocaleLowerCase('pt-BR')}.`,
      estimatedCost: ticket.estimatedCost ?? '',
    }
  }

  function handleSaveTicket(values: MaintenanceCreateTicketFormValues) {
    if (!editingTicket) return
    const property = maintenanceProperties.find((option) => option.id === values.propertyId)
    if (!property) return
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === editingTicket.id
          ? {
              ...ticket,
              property: property.label,
              tenant: property.tenant,
              category: values.category,
              priority: values.priority,
              title: values.title,
              description: values.description,
              estimatedCost: values.estimatedCost,
            }
          : ticket,
      ),
    )
    setEditingTicket(null)
    setIsCreateDialogOpen(false)
  }

  function handleDeleteTicket() {
    if (!deletingTicket) return
    setTickets((current) => current.filter((ticket) => ticket.id !== deletingTicket.id))
    setDeletingTicket(null)
  }

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 2.5 }, py: { xs: 2.4, md: 3.2 } }}>
      <Stack spacing={{ xs: 2, md: 2.7 }}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          justifyContent="space-between"
          spacing={2}
          alignItems={{ lg: 'center' }}
        >
          <Box>
            <Typography
              variant="h3"
              sx={{ fontSize: { xs: 25, md: 29 }, fontWeight: 800, color: brand.graphite[500] }}
            >
              {t('title')}
            </Typography>
            <Typography sx={{ mt: 0.45, color: 'text.secondary', fontSize: 14, fontWeight: 600 }}>
              {t('subtitle')}
            </Typography>
          </Box>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ width: { xs: '100%', lg: 'auto' } }}
          >
            <TextField
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('search')}
              size="small"
              sx={compactFieldSx}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon sx={{ fontSize: 18, color: brand.neutral[400] }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              select
              defaultValue="all"
              size="small"
              sx={{
                ...compactFieldSx,
                width: { xs: '100%', sm: 180 },
                '& .MuiSelect-select': { pr: 4.5 },
              }}
            >
              <MenuItem value="all">
                <Stack direction="row" spacing={0.7} alignItems="center">
                  <ApartmentOutlinedIcon sx={{ fontSize: 17 }} />
                  <span>{t('allProperties')}</span>
                </Stack>
              </MenuItem>
            </TextField>
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon sx={{ fontSize: 17 }} />}
              onClick={() => setIsCreateDialogOpen(true)}
              sx={{
                minHeight: 36,
                px: 2,
                borderRadius: `${radius.sm}px`,
                fontSize: 13,
                fontWeight: 800,
                whiteSpace: 'nowrap',
              }}
            >
              {t('newTicket')}
            </Button>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={0.8} sx={{ overflowX: 'auto', pb: 0.2 }}>
          {maintenanceFilters.map((filter) => (
            <Button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              sx={{
                minWidth: 'max-content',
                minHeight: 30,
                px: 1.55,
                py: 0,
                borderRadius: `${radius.full}px`,
                border: '1px solid',
                borderColor: activeFilter === filter.value ? 'primary.main' : brand.neutral[100],
                bgcolor: activeFilter === filter.value ? 'primary.main' : surface.paper,
                color: activeFilter === filter.value ? surface.paper : brand.neutral[600],
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {t(`filters.${filter.value}`)}
              <Box component="span" sx={{ ml: 0.8, fontSize: 11, fontWeight: 800 }}>
                {getFilterCount(filter)}
              </Box>
            </Button>
          ))}
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
            gap: 1.8,
          }}
        >
          {maintenanceMetrics.map((metric) => (
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
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id} sx={{ '&:last-child td': { borderBottom: 0 } }}>
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
                        href={`/dashboard/maintenance/${ticket.id.slice(1)}`}
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
                      <IconButton
                        aria-label={t('actions.menu', { ticket: ticket.id })}
                        size="small"
                        onClick={(event) => {
                          setMenuAnchor(event.currentTarget)
                          setMenuTicket(ticket)
                        }}
                        sx={{ width: 30, height: 30, color: brand.graphite[500] }}
                      >
                        <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ sm: 'center' }}
            justifyContent="space-between"
            spacing={1}
            sx={{ px: 1.75, py: 1.25, borderTop: '1px solid', borderColor: brand.neutral[100] }}
          >
            <Typography sx={{ fontSize: 13, color: brand.neutral[600], fontWeight: 700 }}>
              {t('showing', {
                showing: filteredTickets.length,
                total: getFilterCount(maintenanceFilters[0]),
              })}
            </Typography>
            <Stack direction="row" spacing={0.5}>
              {['previous', '1', '2', '3', 'next'].map((item) => (
                <Button
                  key={item}
                  sx={{
                    minWidth: item.length === 1 ? 28 : 'auto',
                    height: 28,
                    px: 1.05,
                    borderRadius: `${radius.sm}px`,
                    border: item === '1' ? 0 : '1px solid',
                    borderColor: brand.neutral[100],
                    bgcolor: item === '1' ? 'primary.main' : surface.paper,
                    color: item === '1' ? surface.paper : brand.neutral[600],
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {item === '1' || item === '2' || item === '3' ? item : t(`pagination.${item}`)}
                </Button>
              ))}
            </Stack>
          </Stack>
        </TableContainer>
      </Stack>
      <MaintenanceCreateTicketDialog
        open={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false)
          setEditingTicket(null)
        }}
        onCreate={editingTicket ? handleSaveTicket : handleCreateTicket}
        initialValues={editingTicket ? getFormValues(editingTicket) : undefined}
        mode={editingTicket ? 'edit' : 'create'}
      />
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            setEditingTicket(menuTicket)
            setIsCreateDialogOpen(Boolean(menuTicket))
            closeMenu()
          }}
        >
          <EditOutlinedIcon sx={{ mr: 1, fontSize: 18 }} />
          {t('actions.edit')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeletingTicket(menuTicket)
            closeMenu()
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteOutlineRoundedIcon sx={{ mr: 1, fontSize: 18 }} />
          {t('actions.delete')}
        </MenuItem>
      </Menu>
      <Dialog open={Boolean(deletingTicket)} onClose={() => setDeletingTicket(null)}>
        <DialogTitle>{t('actions.deleteTitle')}</DialogTitle>
        <DialogContent>{t('actions.deleteDescription')}</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingTicket(null)}>{t('createDialog.cancel')}</Button>
          <Button color="error" variant="contained" onClick={handleDeleteTicket}>
            {t('actions.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

const maintenanceProperties = [
  { id: 'apt-jardins-3q', label: 'Apt Jardins 3q', tenant: 'Bruno Oliveira' },
  { id: 'studio-pinheiros', label: 'Studio Pinheiros', tenant: 'Mariana Souza' },
  { id: 'casa-vila-madalena', label: 'Casa Vila Madalena', tenant: 'Felipe Neto' },
  { id: 'cobertura-moema', label: 'Cobertura Moema', tenant: 'Aline Santos' },
] as const

const compactFieldSx = {
  width: { xs: '100%', sm: 200 },
  '& .MuiInputBase-root': {
    height: 36,
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    fontSize: 13,
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

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'open' | 'urgent' | 'averageResolution'
}) {
  const config =
    tone === 'open'
      ? { Icon: FolderOpenOutlinedIcon, bg: '#E5F3FF', color: '#2877E8' }
      : tone === 'urgent'
        ? { Icon: WarningAmberRoundedIcon, bg: '#FDEBEC', color: brand.semantic.error }
        : { Icon: AccessTimeOutlinedIcon, bg: '#FFF5D8', color: '#D98900' }
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.3}
      sx={{
        minHeight: 78,
        px: 2.1,
        py: 1.5,
        bgcolor: surface.paper,
        borderRadius: `${radius.sm}px`,
        boxShadow: shadows.crmCardCompact,
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: config.bg,
          color: config.color,
        }}
      >
        <config.Icon sx={{ fontSize: 22 }} />
      </Box>
      <Box>
        <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 900 }}>
          {label}
        </Typography>
        <Typography
          sx={{ color: brand.graphite[500], fontSize: 30, lineHeight: 1.1, fontWeight: 900 }}
        >
          {value}
        </Typography>
      </Box>
    </Stack>
  )
}

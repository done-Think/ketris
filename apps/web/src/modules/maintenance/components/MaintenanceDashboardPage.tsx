'use client'

import { useMemo, useState } from 'react'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
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
    const matchesFilter = (ticket: MaintenanceTicket) => filter.value === 'all' || (filter.value === 'urgent' ? ticket.priority === 'urgent' : ticket.status === filter.value)
    return filter.count + tickets.filter(matchesFilter).length - maintenanceTickets.filter(matchesFilter).length
  }

  function handleCreateTicket(values: MaintenanceCreateTicketFormValues) {
    const property = maintenanceProperties.find((option) => option.id === values.propertyId)
    if (!property) return
    const nextNumber = Math.max(...tickets.map((ticket) => Number(ticket.id.slice(-4)))) + 1
    setTickets((currentTickets) => [{ id: `#MNT-2025-${String(nextNumber).padStart(4, '0')}`, property: property.label, category: values.category, priority: values.priority, tenant: property.tenant, openedAt: new Intl.DateTimeFormat('pt-BR').format(new Date()), status: 'open' }, ...currentTickets])
    setIsCreateDialogOpen(false)
  }
  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 3.6 }, py: { xs: 2.4, md: 4.2 } }}>
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
              sx={{ fontSize: { xs: 21, md: 24 }, fontWeight: 800, color: brand.graphite[500] }}
            >
              {t('title')}
            </Typography>
            <Typography sx={{ mt: 0.2, color: brand.neutral[500], fontSize: 12 }}>
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
                      <SearchRoundedIcon sx={{ fontSize: 16, color: brand.neutral[400] }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              select
              defaultValue="all"
              size="small"
              sx={{ ...compactFieldSx, width: { xs: '100%', sm: 145 } }}
            >
              <MenuItem value="all">
                <Stack direction="row" spacing={0.7} alignItems="center">
                  <ApartmentOutlinedIcon sx={{ fontSize: 15 }} />
                  <span>{t('allProperties')}</span>
                </Stack>
              </MenuItem>
            </TextField>
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon sx={{ fontSize: 15 }} />}
              onClick={() => setIsCreateDialogOpen(true)}
              sx={{
                minHeight: 30,
                px: 1.7,
                borderRadius: `${radius.sm}px`,
                fontSize: 11,
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
                minHeight: 25,
                px: 1.35,
                py: 0,
                borderRadius: `${radius.full}px`,
                border: '1px solid',
                borderColor: activeFilter === filter.value ? 'primary.main' : brand.neutral[100],
                bgcolor: activeFilter === filter.value ? 'primary.main' : surface.paper,
                color: activeFilter === filter.value ? surface.paper : brand.neutral[600],
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {t(`filters.${filter.value}`)}
              <Box component="span" sx={{ ml: 0.8, fontSize: 10, fontWeight: 800 }}>
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
                  <TableCell key={column} sx={headerCellSx}>
                    {t(`columns.${column}`)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ ...bodyCellSx, color: 'primary.main', fontWeight: 800 }}>
                    {ticket.id}
                  </TableCell>
                  <TableCell sx={{ ...bodyCellSx, fontWeight: 700 }}>{ticket.property}</TableCell>
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
                        height: 19,
                        bgcolor: statusStyles[ticket.status].bgcolor,
                        color: statusStyles[ticket.status].color,
                        fontSize: 9.5,
                        fontWeight: 800,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={bodyCellSx} align="center">
                    <IconButton
                      aria-label={t('viewTicket', { ticket: ticket.id })}
                      size="small"
                      sx={{
                        width: 25,
                        height: 25,
                        borderRadius: `${radius.sm}px`,
                        bgcolor: surface.app,
                        color: brand.graphite[500],
                      }}
                    >
                      <VisibilityOutlinedIcon sx={{ fontSize: 14 }} />
                    </IconButton>
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
            sx={{ px: 1.5, py: 1.1, borderTop: '1px solid', borderColor: brand.neutral[100] }}
          >
            <Typography sx={{ fontSize: 11, color: brand.neutral[600] }}>{t('showing', { showing: filteredTickets.length, total: getFilterCount(maintenanceFilters[0]) })}</Typography>
            <Stack direction="row" spacing={0.5}>
              {['previous', '1', '2', '3', 'next'].map((item) => (
                <Button
                  key={item}
                  sx={{
                    minWidth: item.length === 1 ? 22 : 'auto',
                    height: 22,
                    px: 0.9,
                    borderRadius: `${radius.sm}px`,
                    border: item === '1' ? 0 : '1px solid',
                    borderColor: brand.neutral[100],
                    bgcolor: item === '1' ? 'primary.main' : surface.paper,
                    color: item === '1' ? surface.paper : brand.neutral[600],
                    fontSize: 9.5,
                    fontWeight: 700,
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
        onClose={() => setIsCreateDialogOpen(false)}
        onCreate={handleCreateTicket}
      />
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
    height: 30,
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    fontSize: 11,
    color: brand.neutral[600],
  },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha.graphite[8] },
} as const
const headerCellSx = {
  height: 33,
  px: 1.5,
  py: 0.65,
  bgcolor: surface.app,
  borderColor: brand.neutral[100],
  color: brand.neutral[600],
  fontSize: 9,
  fontWeight: 900,
  letterSpacing: '.07em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
} as const
const bodyCellSx = {
  height: 46,
  px: 1.5,
  py: 0.6,
  borderColor: brand.neutral[100],
  color: brand.neutral[600],
  fontSize: 10.5,
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
        minHeight: 66,
        px: 1.8,
        py: 1.3,
        bgcolor: surface.paper,
        borderRadius: `${radius.sm}px`,
        boxShadow: shadows.crmCardCompact,
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: config.bg,
          color: config.color,
        }}
      >
        <config.Icon sx={{ fontSize: 19 }} />
      </Box>
      <Box>
        <Typography sx={{ color: brand.neutral[600], fontSize: 10.5 }}>{label}</Typography>
        <Typography
          sx={{ color: brand.graphite[500], fontSize: 17, lineHeight: 1.2, fontWeight: 900 }}
        >
          {value}
        </Typography>
      </Box>
    </Stack>
  )
}
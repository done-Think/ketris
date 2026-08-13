'use client'

import { useEffect, useMemo, useState } from 'react'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded'
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import NextLink from 'next/link'
import { useSession } from 'next-auth/react'

import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import { opportunityStageByStatus, opportunityStages } from '../config/opportunity-stages'
import { useOpportunities } from '../hooks/use-opportunities'
import type { OpportunityStatus } from '../types/opportunity'
import { buildContactsFromOpportunities, filterContacts, type CrmContact } from '../utils/contacts'
import { formatRelativeDate, getInitials } from '../utils/formatters'

const PAGE_SIZE = 6
const ALL_STATUSES = 'ALL'
type StatusFilter = OpportunityStatus | typeof ALL_STATUSES

function ContactAvatar({ contact }: { contact: CrmContact }) {
  return (
    <Avatar
      aria-hidden="true"
      sx={{
        width: 34,
        height: 34,
        bgcolor: alpha.magenta[10],
        color: brand.magenta[600],
        fontSize: 11.5,
        fontWeight: 800,
      }}
    >
      {getInitials(contact.name)}
    </Avatar>
  )
}

function ContactTypeChip() {
  return (
    <Chip
      label="Interessado"
      size="small"
      sx={{
        height: 24,
        bgcolor: alpha.magenta[10],
        color: brand.magenta[700],
        fontSize: 11,
        fontWeight: 700,
      }}
    />
  )
}

function OpportunityLink({ contact }: { contact: CrmContact }) {
  return (
    <Tooltip title="Abrir oportunidade">
      <IconButton
        component={NextLink}
        href={`/crm/oportunidades/${contact.latestOpportunityId}`}
        aria-label={`Abrir oportunidade de ${contact.name}`}
        size="small"
        sx={{ color: brand.neutral[500] }}
      >
        <OpenInNewRoundedIcon sx={{ fontSize: iconSize.md }} />
      </IconButton>
    </Tooltip>
  )
}

function ContactsTable({ contacts }: { contacts: CrmContact[] }) {
  return (
    <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
      <Table aria-label="Contatos do CRM" sx={{ minWidth: 780 }}>
        <TableHead>
          <TableRow>
            {['Nome', 'Tipo', 'Telefone', 'E-mail', 'Imóveis', 'Última interação'].map((label) => (
              <TableCell key={label}>{label}</TableCell>
            ))}
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {contacts.map((contact) => {
            const stage = opportunityStageByStatus[contact.latestStatus]

            return (
              <TableRow key={contact.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <ContactAvatar contact={contact} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap sx={{ fontSize: 13, fontWeight: 750 }}>
                        {contact.name}
                      </Typography>
                      <Typography
                        noWrap
                        sx={{ color: stage.color, fontSize: 10.5, fontWeight: 700 }}
                      >
                        {stage.label}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <ContactTypeChip />
                </TableCell>
                <TableCell>{contact.phone ?? 'Não informado'}</TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.propertyIds.length}</TableCell>
                <TableCell>{formatRelativeDate(contact.latestInteractionAt)}</TableCell>
                <TableCell align="right">
                  <OpportunityLink contact={contact} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function ContactsCards({ contacts }: { contacts: CrmContact[] }) {
  return (
    <Stack
      sx={{ display: { xs: 'flex', md: 'none' } }}
      divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />}
    >
      {contacts.map((contact) => {
        const stage = opportunityStageByStatus[contact.latestStatus]

        return (
          <Stack key={contact.id} spacing={1.4} sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <ContactAvatar contact={contact} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography noWrap sx={{ fontSize: 14, fontWeight: 800 }}>
                  {contact.name}
                </Typography>
                <Typography noWrap sx={{ color: 'text.secondary', fontSize: 11.5 }}>
                  {contact.email}
                </Typography>
              </Box>
              <OpportunityLink contact={contact} />
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
              <ContactTypeChip />
              <Chip
                label={stage.label}
                size="small"
                sx={{
                  height: 24,
                  bgcolor: stage.softColor,
                  color: stage.color,
                  fontSize: 10.5,
                  fontWeight: 700,
                }}
              />
            </Stack>

            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Box>
                <Typography sx={{ color: 'text.secondary', fontSize: 10.5 }}>Telefone</Typography>
                <Typography sx={{ fontSize: 12.5, fontWeight: 650 }}>
                  {contact.phone ?? 'Não informado'}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ color: 'text.secondary', fontSize: 10.5 }}>
                  {contact.propertyIds.length === 1 ? 'Imóvel' : 'Imóveis'}
                </Typography>
                <Typography sx={{ fontSize: 12.5, fontWeight: 650 }}>
                  {contact.propertyIds.length}
                </Typography>
              </Box>
            </Stack>

            <Typography sx={{ color: 'text.secondary', fontSize: 11 }}>
              Última interação {formatRelativeDate(contact.latestInteractionAt)}
            </Typography>
          </Stack>
        )
      })}
    </Stack>
  )
}

function ContactsFeedback({
  kind,
  onRetry,
}: {
  kind: 'loading' | 'error' | 'empty' | 'no-results'
  onRetry?: () => void
}) {
  const content = {
    loading: {
      title: 'Carregando contatos',
      description: 'Buscando os interessados das oportunidades.',
    },
    error: {
      title: 'Não foi possível carregar os contatos',
      description: 'Verifique sua conexão e tente novamente.',
    },
    empty: {
      title: 'Nenhum contato encontrado',
      description: 'Os contatos aparecerão aqui quando houver oportunidades cadastradas.',
    },
    'no-results': {
      title: 'Nenhum contato corresponde à busca',
      description: 'Ajuste o termo ou o filtro de etapa para ver outros contatos.',
    },
  }[kind]

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={1.25}
      sx={{ minHeight: 360, px: 2, textAlign: 'center' }}
    >
      {kind === 'loading' ? (
        <CircularProgress size={30} aria-label="Carregando contatos" />
      ) : kind === 'error' ? (
        <ErrorOutlineRoundedIcon sx={{ color: 'error.main', fontSize: 34 }} />
      ) : null}
      <Typography sx={{ fontSize: 15, fontWeight: 800 }}>{content.title}</Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 430, fontSize: 13 }}>
        {content.description}
      </Typography>
      {kind === 'error' && onRetry ? (
        <Button variant="outlined" size="small" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </Stack>
  )
}

export function ContactsList() {
  const { data: session } = useSession()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>(ALL_STATUSES)
  const [page, setPage] = useState(0)
  const filters = status === ALL_STATUSES ? {} : { status }
  const {
    data: opportunities,
    isLoading,
    isError,
    refetch,
  } = useOpportunities(session?.tenantId, filters)

  const contacts = useMemo(
    () => buildContactsFromOpportunities(opportunities ?? []),
    [opportunities],
  )
  const filteredContacts = useMemo(() => filterContacts(contacts, search), [contacts, search])
  const lastPage = Math.max(0, Math.ceil(filteredContacts.length / PAGE_SIZE) - 1)
  const currentPage = Math.min(page, lastPage)
  const visibleContacts = filteredContacts.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE,
  )

  useEffect(() => {
    setPage(0)
  }, [search, status])

  const firstVisible = filteredContacts.length === 0 ? 0 : currentPage * PAGE_SIZE + 1
  const lastVisible = Math.min((currentPage + 1) * PAGE_SIZE, filteredContacts.length)

  return (
    <Box sx={{ minHeight: '100vh', px: { xs: 2, sm: 2.5, lg: 3.5 }, py: { xs: 2.5, lg: 3.5 } }}>
      <Stack
        component="header"
        direction={{ xs: 'column', lg: 'row' }}
        alignItems={{ xs: 'stretch', lg: 'center' }}
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Typography
          component="h1"
          variant="h3"
          sx={{ flexShrink: 0, fontSize: 29, letterSpacing: 0 }}
        >
          Contatos
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.25}
          alignItems={{ sm: 'center' }}
          sx={{ ml: { lg: 'auto' } }}
        >
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, e-mail ou telefone..."
            inputProps={{ 'aria-label': 'Buscar contatos' }}
            size="small"
            sx={{ width: { xs: '100%', sm: 330 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: brand.neutral[400], fontSize: iconSize.lg }} />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 } }}>
            <InputLabel id="contact-status-filter-label">Etapa</InputLabel>
            <Select
              labelId="contact-status-filter-label"
              value={status}
              label="Etapa"
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
            >
              <MenuItem value={ALL_STATUSES}>Todas as etapas</MenuItem>
              {opportunityStages.map((stage) => (
                <MenuItem key={stage.status} value={stage.status}>
                  {stage.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            disabled
            sx={{ minHeight: 40, px: 2, whiteSpace: 'nowrap' }}
          >
            Novo contato
          </Button>
        </Stack>
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          minHeight: { xs: 480, md: 'calc(100vh - 128px)' },
          overflow: 'hidden',
          borderColor: brand.neutral[100],
          borderRadius: `${radius.sm}px`,
          bgcolor: surface.paper,
          boxShadow: shadows.propertyCard,
        }}
      >
        {isLoading ? (
          <ContactsFeedback kind="loading" />
        ) : isError ? (
          <ContactsFeedback kind="error" onRetry={() => void refetch()} />
        ) : contacts.length === 0 ? (
          <ContactsFeedback kind="empty" />
        ) : filteredContacts.length === 0 ? (
          <ContactsFeedback kind="no-results" />
        ) : (
          <Stack sx={{ minHeight: { md: 'calc(100vh - 130px)' } }}>
            <ContactsTable contacts={visibleContacts} />
            <ContactsCards contacts={visibleContacts} />

            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={2}
              sx={{
                mt: 'auto',
                minHeight: 58,
                px: { xs: 2, sm: 2.5 },
                borderTop: 1,
                borderColor: 'divider',
              }}
            >
              <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                Mostrando {firstVisible}-{lastVisible} de {filteredContacts.length}
              </Typography>
              <Stack direction="row" spacing={0.75}>
                <Button
                  variant="outlined"
                  size="small"
                  aria-label="Página anterior"
                  disabled={currentPage === 0}
                  onClick={() => setPage((value) => Math.max(0, value - 1))}
                  startIcon={<ArrowBackIosNewRoundedIcon sx={{ fontSize: '12px !important' }} />}
                >
                  Anterior
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  aria-label="Próxima página"
                  disabled={currentPage >= lastPage}
                  onClick={() => setPage((value) => Math.min(lastPage, value + 1))}
                  endIcon={<ArrowForwardIosRoundedIcon sx={{ fontSize: '12px !important' }} />}
                >
                  Próximo
                </Button>
              </Stack>
            </Stack>
          </Stack>
        )}
      </Paper>
    </Box>
  )
}

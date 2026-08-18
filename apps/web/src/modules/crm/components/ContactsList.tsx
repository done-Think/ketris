'use client'

import { useMemo, useState } from 'react'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  GlobalStyles,
  IconButton,
  InputAdornment,
  Paper,
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
import { alpha as muiAlpha } from '@mui/material/styles'

import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'

import { contactListFixtures, contactsFixtureTotal } from '../fixtures/contact-list-fixtures'
import type { ContactListItem, ContactType } from '../types/contact'
import { filterContacts } from '../utils/contacts'
import { getInitials } from '../utils/formatters'

const contactsBodyFontFamily = 'var(--font-inter), system-ui, -apple-system, sans-serif'

type ContactFilter = 'Todos' | 'Proprietários' | 'Locatários' | 'Corretores'

export type ContactsListProps = {
  contacts?: readonly ContactListItem[]
  totalCount?: number
  page?: number
  onPageChange?: (page: number) => void
  onNewContact?: () => void
  onEditContact?: (contact: ContactListItem) => void
  onOpenInteractions?: (contact: ContactListItem) => void
  onOpenMoreOptions?: (contact: ContactListItem) => void
}

const contactFilters: readonly { label: ContactFilter; type: ContactType | null }[] = [
  { label: 'Todos', type: null },
  { label: 'Proprietários', type: 'Proprietário' },
  { label: 'Locatários', type: 'Locatário' },
  { label: 'Corretores', type: 'Corretor' },
]

const typePresentation: Record<ContactType, { color: string; backgroundColor: string }> = {
  Locatário: {
    color: brand.semantic.success,
    backgroundColor: muiAlpha(brand.semantic.success, 0.1),
  },
  Proprietário: {
    color: brand.semantic.info,
    backgroundColor: muiAlpha(brand.semantic.info, 0.1),
  },
  Corretor: {
    color: brand.magenta[500],
    backgroundColor: brand.magenta[50],
  },
}

function ContactAvatar({ contact }: { contact: ContactListItem }) {
  return (
    <Avatar
      src={contact.avatarUrl}
      alt=""
      aria-hidden="true"
      sx={{
        width: 28,
        height: 28,
        bgcolor: alpha.magenta[10],
        color: brand.magenta[700],
        fontSize: 9.5,
        fontWeight: 800,
      }}
    >
      {getInitials(contact.name)}
    </Avatar>
  )
}

function ContactTypeChip({ type }: { type: ContactType }) {
  const presentation = typePresentation[type]

  return (
    <Chip
      label={type}
      size="small"
      sx={{
        height: 20,
        borderRadius: `${radius.full}px`,
        bgcolor: presentation.backgroundColor,
        color: presentation.color,
        fontSize: 10,
        fontWeight: 600,
        '& .MuiChip-label': { px: 1 },
      }}
    />
  )
}

type ContactActionsProps = Pick<
  ContactsListProps,
  'onEditContact' | 'onOpenInteractions' | 'onOpenMoreOptions'
> & {
  contact: ContactListItem
}

function ContactActions({
  contact,
  onEditContact,
  onOpenInteractions,
  onOpenMoreOptions,
}: ContactActionsProps) {
  const actions = [
    {
      label: `Editar ${contact.name}`,
      icon: EditOutlinedIcon,
      onClick: onEditContact ? () => onEditContact(contact) : undefined,
    },
    {
      label: `Ver interações de ${contact.name}`,
      icon: ChatBubbleOutlineRoundedIcon,
      onClick: onOpenInteractions ? () => onOpenInteractions(contact) : undefined,
    },
    {
      label: `Mais opções para ${contact.name}`,
      icon: MoreHorizRoundedIcon,
      onClick: onOpenMoreOptions ? () => onOpenMoreOptions(contact) : undefined,
    },
  ] as const

  return (
    <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.125}>
      {actions.map(({ label, icon: Icon, onClick }) => (
        <Tooltip key={label} title={label}>
          <Box component="span" sx={{ display: 'inline-flex' }}>
            <IconButton
              type="button"
              aria-label={label}
              size="small"
              disabled={!onClick}
              onClick={onClick}
              sx={{
                width: 24,
                height: 24,
                color: brand.neutral[400],
                '&:hover': { bgcolor: alpha.graphite[6], color: brand.neutral[600] },
                '&.Mui-disabled': { color: brand.neutral[400] },
              }}
            >
              <Icon sx={{ fontSize: iconSize.sm }} />
            </IconButton>
          </Box>
        </Tooltip>
      ))}
    </Stack>
  )
}

type ContactsTableProps = {
  contacts: readonly ContactListItem[]
  selectedIds: ReadonlySet<string>
  onToggleContact: (contactId: string) => void
  onToggleAll: () => void
} & Pick<ContactsListProps, 'onEditContact' | 'onOpenInteractions' | 'onOpenMoreOptions'>

function ContactsTable({
  contacts,
  selectedIds,
  onToggleContact,
  onToggleAll,
  onEditContact,
  onOpenInteractions,
  onOpenMoreOptions,
}: ContactsTableProps) {
  const allSelected =
    contacts.length > 0 && contacts.every((contact) => selectedIds.has(contact.id))
  const someSelected = contacts.some((contact) => selectedIds.has(contact.id)) && !allSelected

  return (
    <TableContainer sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
      <Table
        size="small"
        aria-label="Contatos do CRM"
        sx={{
          minWidth: 900,
          tableLayout: 'fixed',
          '& .MuiTableCell-root': { borderBottom: 0 },
          '& .MuiTableHead-root .MuiTableCell-root': {
            px: 1,
            py: 0,
            color: brand.neutral[500],
            fontSize: 10,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '0.01em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          },
          '& .MuiTableBody-root .MuiTableCell-root': {
            px: 1,
            py: 0,
            color: brand.graphite[500],
            fontSize: 11.5,
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
          },
        }}
      >
        <colgroup>
          <col style={{ width: '4%' }} />
          <col style={{ width: '21%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '21%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '7%' }} />
        </colgroup>
        <TableHead>
          <TableRow sx={{ height: 36, bgcolor: surface.app }}>
            <TableCell padding="checkbox" align="center">
              <Checkbox
                size="small"
                checked={allSelected}
                indeterminate={someSelected}
                onChange={onToggleAll}
                inputProps={{ 'aria-label': 'Selecionar todos os contatos visíveis' }}
                sx={{
                  width: 24,
                  height: 24,
                  p: 0.5,
                  color: brand.neutral[300],
                  '& .MuiSvgIcon-root': { fontSize: iconSize.sm },
                }}
              />
            </TableCell>
            {['Nome', 'Tipo', 'Telefone', 'Email', 'Imóveis', 'Última interação', 'Ações'].map(
              (label) => (
                <TableCell
                  key={label}
                  scope="col"
                  align={label === 'Ações' ? 'right' : 'left'}
                  sx={label === 'Ações' ? { px: '2px !important' } : undefined}
                >
                  {label}
                </TableCell>
              ),
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {contacts.map((contact, index) => {
            const selected = selectedIds.has(contact.id)

            return (
              <TableRow
                key={contact.id}
                selected={selected}
                sx={{
                  height: 50,
                  bgcolor: index % 2 === 1 ? surface.app : surface.paper,
                  '&.Mui-selected, &.Mui-selected:hover': { bgcolor: alpha.magenta[6] },
                  '&:hover': { bgcolor: alpha.graphite[6] },
                }}
              >
                <TableCell padding="checkbox" align="center">
                  <Checkbox
                    size="small"
                    checked={selected}
                    onChange={() => onToggleContact(contact.id)}
                    inputProps={{ 'aria-label': `Selecionar ${contact.name}` }}
                    sx={{
                      width: 24,
                      height: 24,
                      p: 0.5,
                      color: brand.neutral[300],
                      '& .MuiSvgIcon-root': { fontSize: iconSize.sm },
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                    <ContactAvatar contact={contact} />
                    <Typography noWrap sx={{ fontSize: 12, fontWeight: 650 }}>
                      {contact.name}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <ContactTypeChip type={contact.type} />
                </TableCell>
                <TableCell>{contact.phone}</TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell align="center">{contact.propertyCount}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{contact.lastInteraction}</TableCell>
                <TableCell align="right" sx={{ px: '2px !important' }}>
                  <ContactActions
                    contact={contact}
                    onEditContact={onEditContact}
                    onOpenInteractions={onOpenInteractions}
                    onOpenMoreOptions={onOpenMoreOptions}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function ContactsCards({
  contacts,
  selectedIds,
  onToggleContact,
  onEditContact,
  onOpenInteractions,
  onOpenMoreOptions,
}: Omit<ContactsTableProps, 'onToggleAll'>) {
  return (
    <Stack
      aria-label="Lista móvel de contatos"
      sx={{ display: { xs: 'flex', md: 'none' } }}
      divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />}
    >
      {contacts.map((contact) => (
        <Stack key={contact.id} spacing={1.25} sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Checkbox
              size="small"
              checked={selectedIds.has(contact.id)}
              onChange={() => onToggleContact(contact.id)}
              inputProps={{ 'aria-label': `Selecionar ${contact.name}` }}
              sx={{ ml: -0.5, p: 0.5, '& .MuiSvgIcon-root': { fontSize: iconSize.md } }}
            />
            <ContactAvatar contact={contact} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography noWrap sx={{ fontSize: 13, fontWeight: 700 }}>
                {contact.name}
              </Typography>
              <Typography noWrap sx={{ color: 'text.secondary', fontSize: 11 }}>
                {contact.email}
              </Typography>
            </Box>
            <ContactActions
              contact={contact}
              onEditContact={onEditContact}
              onOpenInteractions={onOpenInteractions}
              onOpenMoreOptions={onOpenMoreOptions}
            />
          </Stack>

          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <ContactTypeChip type={contact.type} />
            <Typography sx={{ color: 'text.secondary', fontSize: 11 }}>
              {contact.lastInteraction}
            </Typography>
          </Stack>

          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Typography sx={{ fontSize: 11.5 }}>{contact.phone}</Typography>
            <Typography sx={{ fontSize: 11.5, fontWeight: 600 }}>
              {contact.propertyCount} {contact.propertyCount === 1 ? 'imóvel' : 'imóveis'}
            </Typography>
          </Stack>
        </Stack>
      ))}
    </Stack>
  )
}

export function ContactsList({
  contacts = contactListFixtures,
  totalCount = contactsFixtureTotal,
  page = 1,
  onPageChange,
  onNewContact,
  onEditContact,
  onOpenInteractions,
  onOpenMoreOptions,
}: ContactsListProps = {}) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<ContactFilter>('Todos')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  const filteredContacts = useMemo(() => {
    const selectedType =
      contactFilters.find((filter) => filter.label === activeFilter)?.type ?? null
    return filterContacts(contacts, search, selectedType)
  }, [activeFilter, contacts, search])

  const toggleContact = (contactId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(contactId)) next.delete(contactId)
      else next.add(contactId)
      return next
    })
  }

  const toggleAllVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current)
      const shouldSelectAll = filteredContacts.some((contact) => !next.has(contact.id))

      filteredContacts.forEach((contact) => {
        if (shouldSelectAll) next.add(contact.id)
        else next.delete(contact.id)
      })

      return next
    })
  }

  const isDefaultView = activeFilter === 'Todos' && search.trim() === ''
  const resultTotal = isDefaultView ? totalCount : filteredContacts.length
  const firstVisible =
    filteredContacts.length > 0 ? (isDefaultView ? (page - 1) * contacts.length + 1 : 1) : 0
  const lastVisible =
    filteredContacts.length > 0
      ? isDefaultView
        ? Math.min(firstVisible + filteredContacts.length - 1, resultTotal)
        : filteredContacts.length
      : 0
  const canGoBack = isDefaultView && page > 1
  const canGoForward =
    isDefaultView &&
    filteredContacts.length > 0 &&
    firstVisible + filteredContacts.length <= resultTotal

  return (
    <Box
      sx={{
        minHeight: '100vh',
        px: { xs: 2, sm: 3, lg: 3.5 },
        pt: { xs: 2, sm: 3, lg: 3.5 },
        pb: { xs: 2, sm: 2.5, lg: 2.5 },
        bgcolor: surface.app,
        fontFamily: contactsBodyFontFamily,
        '& .MuiTypography-root, & .MuiButton-root, & .MuiInputBase-root, & .MuiTableCell-root': {
          fontFamily: contactsBodyFontFamily,
        },
      }}
    >
      <GlobalStyles styles={{ '.tsqd-parent-container': { display: 'none' } }} />

      <Stack
        component="header"
        direction={{ xs: 'column', lg: 'row' }}
        alignItems={{ xs: 'stretch', lg: 'center' }}
        justifyContent="space-between"
        gap={1.5}
        sx={{
          pb: 1.75,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography
          component="h1"
          sx={{
            flexShrink: 0,
            fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
            fontSize: { xs: 26, sm: 30 },
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
          }}
        >
          Contatos
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ sm: 'center' }}
          justifyContent={{ sm: 'flex-end' }}
          gap={1.25}
          sx={{ minWidth: 0, flexWrap: { sm: 'wrap', lg: 'nowrap' } }}
        >
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar contato por nome, email, fone..."
            inputProps={{ 'aria-label': 'Buscar contatos' }}
            size="small"
            sx={{
              width: { xs: '100%', sm: 268 },
              '& .MuiOutlinedInput-root': {
                height: 32,
                borderRadius: `${radius.sm}px`,
                bgcolor: surface.paper,
                fontSize: 11.5,
                '& fieldset': { borderColor: brand.neutral[100] },
                '&:hover fieldset': { borderColor: brand.neutral[200] },
              },
              '& .MuiInputBase-input::placeholder': {
                color: brand.neutral[400],
                opacity: 1,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: brand.neutral[400], fontSize: iconSize.sm }} />
                </InputAdornment>
              ),
            }}
          />

          <Stack
            component="div"
            role="group"
            aria-label="Filtrar contatos por tipo"
            direction="row"
            spacing={0.75}
            sx={{ overflowX: { xs: 'auto', sm: 'visible' }, pb: { xs: 0.25, sm: 0 } }}
          >
            {contactFilters.map(({ label }) => {
              const active = label === activeFilter

              return (
                <Button
                  key={label}
                  type="button"
                  variant={active ? 'contained' : 'outlined'}
                  aria-pressed={active}
                  onClick={() => setActiveFilter(label)}
                  sx={{
                    minWidth: 0,
                    height: 28,
                    px: 1.4,
                    flexShrink: 0,
                    borderColor: active ? brand.magenta[500] : brand.neutral[100],
                    borderRadius: `${radius.full}px`,
                    bgcolor: active ? brand.magenta[500] : surface.paper,
                    color: active ? surface.lightText : brand.graphite[500],
                    fontSize: 10.5,
                    fontWeight: active ? 700 : 500,
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      borderColor: active ? brand.magenta[600] : brand.neutral[200],
                      bgcolor: active ? brand.magenta[600] : surface.paper,
                    },
                  }}
                >
                  {label}
                </Button>
              )
            })}
          </Stack>

          <Button
            type="button"
            variant="contained"
            startIcon={<AddRoundedIcon />}
            disabled={!onNewContact}
            onClick={onNewContact}
            sx={{
              width: { sm: 126 },
              minWidth: { sm: 126 },
              height: 32,
              px: 1.5,
              flexShrink: 0,
              borderRadius: `${radius.sm}px`,
              fontSize: 11.5,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              '& .MuiButton-startIcon': { ml: 0, mr: 0.625 },
              '& .MuiSvgIcon-root': { fontSize: iconSize.sm },
              '&.Mui-disabled': {
                bgcolor: brand.magenta[500],
                color: surface.lightText,
                opacity: 1,
              },
            }}
          >
            Novo Contato
          </Button>
        </Stack>
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          display: 'flex',
          minHeight: { xs: 520, md: 'calc(100vh - 118px)' },
          mt: 2.25,
          overflow: 'hidden',
          flexDirection: 'column',
          borderColor: brand.neutral[100],
          borderRadius: `${radius.lg}px`,
          bgcolor: surface.paper,
          boxShadow: `0 2px 8px ${alpha.graphite[6]}`,
        }}
      >
        {filteredContacts.length > 0 ? (
          <>
            <ContactsTable
              contacts={filteredContacts}
              selectedIds={selectedIds}
              onToggleContact={toggleContact}
              onToggleAll={toggleAllVisible}
              onEditContact={onEditContact}
              onOpenInteractions={onOpenInteractions}
              onOpenMoreOptions={onOpenMoreOptions}
            />
            <ContactsCards
              contacts={filteredContacts}
              selectedIds={selectedIds}
              onToggleContact={toggleContact}
              onEditContact={onEditContact}
              onOpenInteractions={onOpenInteractions}
              onOpenMoreOptions={onOpenMoreOptions}
            />
          </>
        ) : (
          <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 240, px: 2 }}>
            <Typography sx={{ color: 'text.secondary', fontSize: 12.5 }}>
              Nenhum contato encontrado.
            </Typography>
          </Stack>
        )}

        <Stack
          component="footer"
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          sx={{
            mt: 'auto',
            minHeight: 52,
            px: 2,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Typography color="text.secondary" sx={{ fontSize: 11.5 }}>
            Mostrando {firstVisible}–{lastVisible} de {resultTotal}
          </Typography>
          <Stack direction="row" spacing={0.75}>
            {[
              {
                label: 'Anterior',
                disabled: !onPageChange || !canGoBack,
                onClick: () => onPageChange?.(page - 1),
              },
              {
                label: 'Próximo',
                disabled: !onPageChange || !canGoForward,
                onClick: () => onPageChange?.(page + 1),
              },
            ].map(({ label, disabled, onClick }) => (
              <Button
                key={label}
                type="button"
                variant="outlined"
                size="small"
                disabled={disabled}
                onClick={onClick}
                sx={{
                  minWidth: 62,
                  height: 24,
                  px: 1,
                  borderColor: brand.neutral[100],
                  borderRadius: '6px',
                  bgcolor: surface.paper,
                  color: brand.neutral[500],
                  fontSize: 10.5,
                  fontWeight: 500,
                  '&:hover': { borderColor: brand.neutral[200], bgcolor: surface.paper },
                  '&.Mui-disabled': {
                    borderColor: brand.neutral[100],
                    bgcolor: surface.paper,
                    color: brand.neutral[500],
                    opacity: 1,
                  },
                }}
              >
                {label}
              </Button>
            ))}
          </Stack>
        </Stack>
      </Paper>
    </Box>
  )
}

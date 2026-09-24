'use client'

import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  GlobalStyles,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'

import { DashboardTablePagination } from '@shared/components/layout'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import { contactFilters } from '../config/contact-filters'
import { contactListFixtures, contactsFixtureTotal } from '../fixtures/contact-list-fixtures'
import type { ContactFilter, ContactsListProps } from '../types/contact'
import { filterContacts } from '../utils/contacts'
import { ContactsCards } from './contacts-list/ContactsCards'
import { ContactsHeader } from './contacts-list/ContactsHeader'
import { ContactsTable } from './contacts-list/ContactsTable'

const contactsBodyFontFamily = 'var(--font-inter), system-ui, -apple-system, sans-serif'

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
  const t = useTranslations('crm.contacts')
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
  const rowsPerPage = isDefaultView
    ? Math.max(contacts.length, 5)
    : Math.max(filteredContacts.length, 5)
  const getFilterCount = (filter: ContactFilter) => {
    const selectedType = contactFilters.find((option) => option.label === filter)?.type ?? null
    return filterContacts(contacts, search, selectedType).length
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        px: { xs: 2, md: 3.6 },
        py: { xs: 2.4, md: 4.2 },
        bgcolor: surface.app,
        fontFamily: contactsBodyFontFamily,
        '& .MuiTypography-root, & .MuiButton-root, & .MuiInputBase-root, & .MuiTableCell-root': {
          fontFamily: contactsBodyFontFamily,
        },
      }}
    >
      <GlobalStyles styles={{ '.tsqd-parent-container': { display: 'none' } }} />

      <ContactsHeader search={search} onSearchChange={setSearch} onNewContact={onNewContact} />

      <ContactsTypeFilters
        activeFilter={activeFilter}
        getFilterCount={getFilterCount}
        onFilterChange={setActiveFilter}
      />

      <Paper
        variant="outlined"
        sx={{
          display: 'flex',
          minHeight: { xs: 520, md: 'calc(100vh - 118px)' },
          mt: 2.25,
          overflow: 'hidden',
          flexDirection: 'column',
          borderColor: alpha.graphite[6],
          borderRadius: `${radius.sm}px`,
          bgcolor: surface.paper,
          boxShadow: shadows.propertyCard,
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
            <Typography sx={{ color: 'text.secondary', fontSize: 16.5 }}>{t('empty')}</Typography>
          </Stack>
        )}

        <DashboardTablePagination
          count={resultTotal}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[...new Set([rowsPerPage, 10, 25])]}
          onPageChange={onPageChange}
        />
      </Paper>
    </Box>
  )
}

function ContactsTypeFilters({
  activeFilter,
  getFilterCount,
  onFilterChange,
}: {
  activeFilter: ContactFilter
  getFilterCount: (filter: ContactFilter) => number
  onFilterChange: (filter: ContactFilter) => void
}) {
  const t = useTranslations('crm.contacts')
  const activeOption =
    contactFilters.find((filter) => filter.label === activeFilter) ?? contactFilters[0]

  return (
    <>
      <TextField
        select
        size="small"
        value={activeFilter}
        onChange={(event) => onFilterChange(event.target.value as ContactFilter)}
        sx={{
          display: { xs: 'block', sm: 'none' },
          width: '100%',
          mt: 2,
          '& .MuiOutlinedInput-root': {
            minHeight: 50,
            borderRadius: `${radius.sm}px`,
            bgcolor: surface.paper,
            color: brand.graphite[500],
            fontSize: 18,
            fontWeight: 800,
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'transparent',
              borderWidth: 0,
            },
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'transparent',
            borderWidth: 0,
          },
          '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'transparent',
          },
        }}
        SelectProps={{
          inputProps: { 'aria-label': t('filterAriaLabel') },
          renderValue: () => (
            <ContactFilterLabel
              active
              count={getFilterCount(activeOption.label)}
              label={t(`filters.${activeOption.labelKey}`)}
            />
          ),
          MenuProps: {
            PaperProps: {
              sx: {
                mt: 0.6,
                borderRadius: `${radius.sm}px`,
                boxShadow: shadows.popover,
              },
            },
          },
        }}
      >
        {contactFilters.map((filter) => {
          const active = filter.label === activeFilter

          return (
            <MenuItem
              key={filter.label}
              value={filter.label}
              sx={{
                minHeight: 46,
                bgcolor: active ? alpha.magenta[8] : 'transparent',
                '&:hover': { bgcolor: alpha.magenta[8] },
              }}
            >
              <ContactFilterLabel
                active={active}
                count={getFilterCount(filter.label)}
                label={t(`filters.${filter.labelKey}`)}
              />
            </MenuItem>
          )
        })}
      </TextField>

      <Stack
        direction="row"
        spacing={0.8}
        useFlexGap
        flexWrap="wrap"
        sx={{ display: { xs: 'none', sm: 'flex' }, mt: 2, mb: -0.25 }}
      >
        {contactFilters.map((filter) => {
          const active = filter.label === activeFilter

          return (
            <Button
              key={filter.label}
              type="button"
              variant="contained"
              aria-pressed={active}
              onClick={() => onFilterChange(filter.label)}
              sx={{
                minHeight: 42,
                borderRadius: `${radius.full}px`,
                px: 1.8,
                gap: 0.6,
                fontSize: 17,
                fontWeight: 900,
                bgcolor: active ? 'primary.main' : alpha.graphite[6],
                color: active ? surface.lightText : brand.graphite[500],
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: active ? 'primary.main' : alpha.graphite[10],
                  boxShadow: 'none',
                },
              }}
            >
              {t(`filters.${filter.labelKey}`)}
              <Box
                component="span"
                sx={{
                  display: 'grid',
                  minWidth: 24,
                  height: 24,
                  placeItems: 'center',
                  px: 0.5,
                  borderRadius: `${radius.full}px`,
                  bgcolor: active ? alpha.white[8] : alpha.graphite[6],
                  color: active ? surface.lightText : brand.neutral[500],
                  fontSize: 14.5,
                  fontWeight: 800,
                }}
              >
                {getFilterCount(filter.label)}
              </Box>
            </Button>
          )
        })}
      </Stack>
    </>
  )
}

function ContactFilterLabel({
  active,
  count,
  label,
}: {
  active: boolean
  count: number
  label: string
}) {
  return (
    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
      <Box component="span">{label}</Box>
      <Box
        component="span"
        sx={{
          display: 'grid',
          minWidth: 26,
          height: 26,
          placeItems: 'center',
          px: 0.6,
          borderRadius: `${radius.full}px`,
          bgcolor: active ? brand.magenta[500] : alpha.graphite[6],
          color: active ? surface.lightText : brand.neutral[500],
          fontSize: 15,
          fontWeight: 900,
        }}
      >
        {count}
      </Box>
    </Box>
  )
}

'use client'

import { useMemo, useState } from 'react'
import { Box, GlobalStyles, Paper, Stack, Typography } from '@mui/material'

import { brand, radius, shadows, surface } from '@shared/theme/tokens'

import { contactFilters } from '../config/contact-filters'
import { contactListFixtures, contactsFixtureTotal } from '../fixtures/contact-list-fixtures'
import type { ContactFilterId, ContactsListProps } from '../types/contact'
import { filterContacts } from '../utils/contacts'
import { ContactsCards } from './contacts-list/ContactsCards'
import { ContactsHeader } from './contacts-list/ContactsHeader'
import { ContactsPaginationFooter } from './contacts-list/ContactsPaginationFooter'
import { ContactsTable } from './contacts-list/ContactsTable'

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
  const [activeFilterId, setActiveFilterId] = useState<ContactFilterId>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  const filteredContacts = useMemo(() => {
    const selectedType = contactFilters.find((filter) => filter.id === activeFilterId)?.type ?? null
    return filterContacts(contacts, search, selectedType)
  }, [activeFilterId, contacts, search])

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

  const isDefaultView = activeFilterId === 'all' && search.trim() === ''
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
        display: 'flex',
        minHeight: '100vh',
        flexDirection: 'column',
        px: { xs: 2, sm: 3, lg: 3.5 },
        pt: { xs: 2, sm: 3, lg: 3.5 },
        pb: { xs: 2, sm: 2.5, lg: 2.5 },
        bgcolor: surface.app,
      }}
    >
      <GlobalStyles styles={{ '.tsqd-parent-container': { display: 'none' } }} />

      <ContactsHeader
        search={search}
        activeFilterId={activeFilterId}
        onSearchChange={setSearch}
        onFilterChange={setActiveFilterId}
        onNewContact={onNewContact}
      />

      <Paper
        variant="outlined"
        sx={{
          display: 'flex',
          minHeight: { xs: 520, md: 0 },
          mt: 2.25,
          overflow: 'hidden',
          flex: 1,
          flexDirection: 'column',
          borderColor: brand.neutral[100],
          borderRadius: `${radius.lg}px`,
          bgcolor: surface.paper,
          boxShadow: shadows.crmListPanel,
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
            <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
              Nenhum contato encontrado.
            </Typography>
          </Stack>
        )}

        <ContactsPaginationFooter
          firstVisible={firstVisible}
          lastVisible={lastVisible}
          resultTotal={resultTotal}
          page={page}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onPageChange={onPageChange}
        />
      </Paper>
    </Box>
  )
}

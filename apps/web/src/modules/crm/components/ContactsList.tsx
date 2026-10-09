'use client'

import { useEffect, useMemo, useState } from 'react'
import { Box, GlobalStyles, Paper, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { DashboardTablePagination } from '@shared/components/layout'
import { brand, radius, shadows, surface } from '@shared/theme/tokens'

import { contactFilters } from '../config/contact-filters'
import { contactListFixtures, contactsFixtureTotal } from '../fixtures/contact-list-fixtures'
import type { ContactFilter, ContactsListProps } from '../types/contact'
import { contactsDefaultPageSize, filterContacts, paginateContacts } from '../utils/contacts'
import { ContactsCards } from './contacts-list/ContactsCards'
import { ContactsHeader } from './contacts-list/ContactsHeader'
import { ContactsStatusFilters } from './contacts-list/ContactsStatusFilters'
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
  const [internalPage, setInternalPage] = useState(page)
  const [rowsPerPage, setRowsPerPage] = useState(contactsDefaultPageSize)
  const currentPage = onPageChange ? page : internalPage

  const filteredContacts = useMemo(() => {
    const selectedType =
      contactFilters.find((filter) => filter.label === activeFilter)?.type ?? null
    return filterContacts(contacts, search, selectedType)
  }, [activeFilter, contacts, search])

  const isDefaultView = activeFilter === 'Todos' && search.trim() === ''
  const contactPage = useMemo(
    () => paginateContacts(filteredContacts, currentPage, rowsPerPage),
    [currentPage, filteredContacts, rowsPerPage],
  )
  const resultTotal = isDefaultView && onPageChange ? totalCount : contactPage.totalCount
  const visibleContacts = contactPage.items

  function handlePageChange(nextPage: number) {
    if (onPageChange) {
      onPageChange(nextPage)
      return
    }

    setInternalPage(nextPage)
  }

  function resetPage() {
    if (onPageChange) {
      onPageChange(1)
      return
    }

    setInternalPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    resetPage()
  }

  function handleFilterChange(filter: ContactFilter) {
    setActiveFilter(filter)
    resetPage()
  }

  useEffect(() => {
    setInternalPage(page)
  }, [page])

  return (
    <Box
      sx={{
        width: '100%',
        p: 3.5,
        bgcolor: surface.app,
        fontFamily: contactsBodyFontFamily,
        '& .MuiTypography-root, & .MuiButton-root, & .MuiInputBase-root, & .MuiTableCell-root': {
          fontFamily: contactsBodyFontFamily,
        },
        '& h1.MuiTypography-root': {
          fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
        },
      }}
    >
      <GlobalStyles styles={{ '.tsqd-parent-container': { display: 'none' } }} />

      <Stack spacing={2}>
        <ContactsHeader
          search={search}
          onSearchChange={handleSearchChange}
          onNewContact={onNewContact}
        />

        <ContactsStatusFilters
          activeFilter={activeFilter}
          contacts={contacts}
          onFilterChange={handleFilterChange}
        />
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          display: 'flex',
          minHeight: { xs: 420, md: 360 },
          mt: 2.25,
          overflow: 'hidden',
          flexDirection: 'column',
          borderColor: brand.neutral[100],
          borderRadius: `${radius.lg}px`,
          bgcolor: surface.paper,
          boxShadow: shadows.crmListPanel,
        }}
      >
        {visibleContacts.length > 0 ? (
          <>
            <ContactsTable
              contacts={visibleContacts}
              onEditContact={onEditContact}
              onOpenInteractions={onOpenInteractions}
              onOpenMoreOptions={onOpenMoreOptions}
            />
            <ContactsCards
              contacts={visibleContacts}
              onEditContact={onEditContact}
              onOpenInteractions={onOpenInteractions}
              onOpenMoreOptions={onOpenMoreOptions}
            />
          </>
        ) : (
          <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 240, px: 2 }}>
            <Typography sx={{ color: 'text.secondary', fontSize: 12.5 }}>{t('empty')}</Typography>
          </Stack>
        )}

        <DashboardTablePagination
          count={resultTotal}
          page={contactPage.page}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={(nextRowsPerPage) => {
            setRowsPerPage(nextRowsPerPage)
            resetPage()
          }}
        />
      </Paper>
    </Box>
  )
}

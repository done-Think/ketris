'use client'

import { useMemo, useState } from 'react'
import { Box, GlobalStyles, Paper, Stack, Typography } from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'
import type { AppLocale } from '@/i18n/types/locale.types'

import { brand, radius, shadows, surface } from '@shared/theme/tokens'

import { contactFilters } from '../config/contact-filters'
import { getContactListFixtures, contactsFixtureTotal } from '../fixtures/contact-list-fixtures'
import type { ContactFilter, ContactsListProps } from '../types/contact'
import { filterContacts } from '../utils/contacts'
import { ContactsCards } from './contacts-list/ContactsCards'
import { ContactsHeader } from './contacts-list/ContactsHeader'
import { ContactsPaginationFooter } from './contacts-list/ContactsPaginationFooter'
import { ContactsTable } from './contacts-list/ContactsTable'

const contactsBodyFontFamily = 'var(--font-inter), system-ui, -apple-system, sans-serif'

export function ContactsList({
  contacts,
  totalCount = contactsFixtureTotal,
  page = 1,
  onPageChange,
  onNewContact,
  onEditContact,
  onOpenInteractions,
  onOpenMoreOptions,
}: ContactsListProps = {}) {
  const locale = useLocale() as AppLocale
  const t = useTranslations('crm.contacts')
  const visibleContacts = useMemo(
    () => contacts ?? getContactListFixtures(locale),
    [contacts, locale],
  )
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<ContactFilter>('Todos')

  const filteredContacts = useMemo(() => {
    const selectedType =
      contactFilters.find((filter) => filter.label === activeFilter)?.type ?? null
    return filterContacts(visibleContacts, search, selectedType)
  }, [activeFilter, visibleContacts, search])

  const isDefaultView = activeFilter === 'Todos' && search.trim() === ''
  const resultTotal = isDefaultView ? totalCount : filteredContacts.length
  const firstVisible =
    filteredContacts.length > 0 ? (isDefaultView ? (page - 1) * visibleContacts.length + 1 : 1) : 0
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

      <ContactsHeader
        search={search}
        activeFilter={activeFilter}
        onSearchChange={setSearch}
        onFilterChange={setActiveFilter}
        onNewContact={onNewContact}
      />

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
          boxShadow: shadows.crmListPanel,
        }}
      >
        {filteredContacts.length > 0 ? (
          <>
            <ContactsTable
              contacts={filteredContacts}
              onEditContact={onEditContact}
              onOpenInteractions={onOpenInteractions}
              onOpenMoreOptions={onOpenMoreOptions}
            />
            <ContactsCards
              contacts={filteredContacts}
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

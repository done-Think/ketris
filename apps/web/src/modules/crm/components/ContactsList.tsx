'use client'

import { useEffect, useMemo, useState } from 'react'
import { GlobalStyles } from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'
import type { AppLocale } from '@/i18n/types/locale.types'

import { contactFilters } from '../config/contact-filters'
import { getContactListFixtures, contactsFixtureTotal } from '../fixtures/contact-list-fixtures'
import type { ContactFilter, ContactsListProps } from '../types/contact'
import { contactsDefaultPageSize, filterContacts, paginateContacts } from '../utils/contacts'
import { CrmListLayout } from './CrmListLayout'
import { ContactsCards } from './contacts-list/ContactsCards'
import { ContactsHeader } from './contacts-list/ContactsHeader'
import { ContactsStatusFilters } from './contacts-list/ContactsStatusFilters'
import { ContactsTable } from './contacts-list/ContactsTable'

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
  const resolvedContacts = useMemo(
    () => contacts ?? getContactListFixtures(locale),
    [contacts, locale],
  )
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<ContactFilter>('Todos')
  const [internalPage, setInternalPage] = useState(page)
  const [rowsPerPage, setRowsPerPage] = useState(contactsDefaultPageSize)
  const currentPage = onPageChange ? page : internalPage

  const filteredContacts = useMemo(() => {
    const selectedType =
      contactFilters.find((filter) => filter.label === activeFilter)?.type ?? null
    return filterContacts(resolvedContacts, search, selectedType)
  }, [activeFilter, resolvedContacts, search])

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
    <>
      <GlobalStyles styles={{ '.tsqd-parent-container': { display: 'none' } }} />
      <CrmListLayout
        header={
          <ContactsHeader
            search={search}
            onSearchChange={handleSearchChange}
            onNewContact={onNewContact}
          />
        }
        filters={
          <ContactsStatusFilters
            activeFilter={activeFilter}
            contacts={resolvedContacts}
            onFilterChange={handleFilterChange}
          />
        }
        table={
          <ContactsTable
            contacts={visibleContacts}
            onEditContact={onEditContact}
            onOpenInteractions={onOpenInteractions}
            onOpenMoreOptions={onOpenMoreOptions}
          />
        }
        cards={
          <ContactsCards
            contacts={visibleContacts}
            onEditContact={onEditContact}
            onOpenInteractions={onOpenInteractions}
            onOpenMoreOptions={onOpenMoreOptions}
          />
        }
        isEmpty={visibleContacts.length === 0}
        emptyMessage={t('empty')}
        pagination={{
          count: resultTotal,
          page: contactPage.page,
          rowsPerPage,
          onPageChange: handlePageChange,
          onRowsPerPageChange: (nextRowsPerPage) => {
            setRowsPerPage(nextRowsPerPage)
            resetPage()
          },
        }}
      />
    </>
  )
}

'use client'

import { useTranslations } from 'next-intl'
import type { ContactsListProps } from '../types/contact'
import { CrmListLayout } from './CrmListLayout'
import { ContactsCards } from './contacts-list/ContactsCards'
import { ContactsHeader } from './contacts-list/ContactsHeader'
import { ContactsStatusFilters } from './contacts-list/ContactsStatusFilters'
import { ContactsTable } from './contacts-list/ContactsTable'

export function ContactsList({
  contacts = [],
  totalCount = 0,
  page = 1,
  rowsPerPage = 5,
  search = '',
  activeFilter = 'ALL',
  counts = {},
  onSearchChange = () => {},
  onFilterChange = () => {},
  onPageChange = () => {},
  onRowsPerPageChange = () => {},
  isLoading,
  error,
  onRetry,
  onNewContact,
  onEditContact,
  onOpenInteractions,
  onOpenMoreOptions,
}: ContactsListProps = {}) {
  const t = useTranslations('crm.contacts')
  const actions = { onEditContact, onOpenInteractions, onOpenMoreOptions }
  return (
    <CrmListLayout
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      header={
        <ContactsHeader
          search={search}
          onSearchChange={onSearchChange}
          onNewContact={onNewContact}
        />
      }
      filters={
        <ContactsStatusFilters
          activeFilter={activeFilter}
          counts={counts}
          onFilterChange={onFilterChange}
        />
      }
      table={<ContactsTable contacts={contacts} {...actions} />}
      cards={<ContactsCards contacts={contacts} {...actions} />}
      isEmpty={contacts.length === 0}
      emptyMessage={t('empty')}
      pagination={{ count: totalCount, page, rowsPerPage, onPageChange, onRowsPerPageChange }}
    />
  )
}

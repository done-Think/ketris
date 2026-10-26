'use client'

import { useCrmFormatter } from '../hooks/use-crm-formatter'

import { useDebouncedValue } from '@shared/hooks/use-debounced-value'
import { useListState } from '@shared/hooks/use-list-state'
import type { ContactFilter } from '../types/contact'
import { crmPageCounts } from '../utils/page-counts'

import type { AppLocale } from '@/i18n/types/locale.types'
import { useSession } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useState } from 'react'

import {
  useArchiveContact,
  useContacts,
  useCreateContact,
  useUpdateContact,
} from '../hooks/use-contacts'
import type { ApiContactListItem, ContactFormValues, ContactListItem } from '../types/contact'
import { mapContactToListItem } from '../utils/contact-adapter'
import { errorMessage } from '../utils/error-message'
import { ContactsList } from './ContactsList'
import { ArchiveContactDialog } from './contacts-list/ArchiveContactDialog'
import { ContactFormDialog } from './contacts-list/ContactFormDialog'

export function ContactsPage() {
  const format = useCrmFormatter()
  const locale = useLocale() as AppLocale
  const t = useTranslations('crm.contacts')
  const { data: session } = useSession()
  const tenantId = session?.tenantId ?? ''
  const { enqueueSnackbar } = useSnackbar()

  const { filters: list, setFilter } = useListState({
    search: '',
    type: 'ALL' as ContactFilter,
    page: 1,
    pageSize: 5,
  })
  const query = useDebouncedValue(list.search)
  const contactsQuery = useContacts(tenantId, {
    q: query || undefined,
    type: list.type === 'ALL' ? undefined : list.type,
    page: list.page,
    pageSize: list.pageSize,
  })
  const createContact = useCreateContact(tenantId)
  const updateContact = useUpdateContact(tenantId)
  const archiveContact = useArchiveContact(tenantId)

  const [formOpen, setFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<ApiContactListItem | null>(null)
  const [archivingContact, setArchivingContact] = useState<ApiContactListItem | null>(null)

  const apiContacts = contactsQuery.data?.contacts ?? []
  const contacts = apiContacts.map((contact) => mapContactToListItem(contact, locale, format))
  const totalCount = contactsQuery.data?.pagination.totalCount ?? 0

  function findRawContact(item: ContactListItem): ApiContactListItem | undefined {
    return apiContacts.find((contact) => contact.id === item.id)
  }

  function openCreateDialog() {
    setEditingContact(null)
    setFormOpen(true)
  }

  function openEditDialog(item: ContactListItem) {
    const raw = findRawContact(item)
    if (!raw) return

    setEditingContact(raw)
    setFormOpen(true)
  }

  function openArchiveDialog(item: ContactListItem) {
    const raw = findRawContact(item)
    if (!raw) return

    setArchivingContact(raw)
  }

  async function handleSave(values: ContactFormValues) {
    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim() || null,
      type: values.type,
      notes: values.notes.trim() || null,
    }

    try {
      if (editingContact) {
        await updateContact.mutateAsync({ id: editingContact.id, changes: payload })
        enqueueSnackbar(t('contactForm.updateSuccess'), { variant: 'success' })
      } else {
        await createContact.mutateAsync(payload)
        enqueueSnackbar(t('contactForm.createSuccess'), { variant: 'success' })
      }
      setFormOpen(false)
    } catch (error) {
      enqueueSnackbar(
        errorMessage(error, t('contactForm.saveError'), {
          CONTACT_EMAIL_ALREADY_EXISTS: t('contactForm.emailAlreadyExists'),
        }),
        { variant: 'error' },
      )
    }
  }

  async function handleArchiveConfirm() {
    if (!archivingContact) return

    try {
      await archiveContact.mutateAsync(archivingContact.id)
      enqueueSnackbar(t('archiveDialog.success'), { variant: 'success' })
      setArchivingContact(null)
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('archiveDialog.error')), { variant: 'error' })
    }
  }

  const initialFormValues: ContactFormValues | null = editingContact
    ? {
        name: editingContact.name,
        email: editingContact.email,
        phone: editingContact.phone ?? '',
        type: editingContact.type,
        notes: editingContact.notes ?? '',
      }
    : null

  return (
    <>
      <ContactsList
        isLoading={contactsQuery.isLoading}
        error={contactsQuery.isError}
        onRetry={() => void contactsQuery.refetch()}
        contacts={contacts}
        totalCount={totalCount}
        search={list.search}
        activeFilter={list.type}
        counts={crmPageCounts(contactsQuery.data?.groups)}
        page={contactsQuery.data?.pagination.page ?? list.page}
        rowsPerPage={list.pageSize}
        onSearchChange={(value) => {
          setFilter('search', value)
          setFilter('page', 1)
        }}
        onFilterChange={(value) => {
          setFilter('type', value)
          setFilter('page', 1)
        }}
        onPageChange={(value) => setFilter('page', value)}
        onRowsPerPageChange={(value) => {
          setFilter('pageSize', value)
          setFilter('page', 1)
        }}
        onNewContact={openCreateDialog}
        onEditContact={openEditDialog}
        onOpenMoreOptions={openArchiveDialog}
      />

      <ContactFormDialog
        key={editingContact?.id ?? 'new'}
        open={formOpen}
        initialValues={initialFormValues}
        isPending={createContact.isPending || updateContact.isPending}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      <ArchiveContactDialog
        open={Boolean(archivingContact)}
        isPending={archiveContact.isPending}
        onClose={() => setArchivingContact(null)}
        onConfirm={handleArchiveConfirm}
      />
    </>
  )
}

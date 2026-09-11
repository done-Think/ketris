'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import {
  useArchiveContact,
  useContacts,
  useCreateContact,
  useUpdateContact,
} from '../hooks/use-contacts'
import type { ContactFormValues } from '../schemas/contact-schema'
import type { ApiContactListItem, ContactListItem } from '../types/contact'
import { mapContactToListItem } from '../utils/contact-adapter'
import { errorMessage } from '../utils/error-message'
import { ContactsList } from './ContactsList'
import { ArchiveContactDialog } from './contacts-list/ArchiveContactDialog'
import { ContactFormDialog } from './contacts-list/ContactFormDialog'

export function ContactsPage() {
  const t = useTranslations('crm.contacts')
  const { data: session } = useSession()
  const tenantId = session?.tenantId ?? ''
  const { enqueueSnackbar } = useSnackbar()

  const contactsQuery = useContacts(tenantId)
  const createContact = useCreateContact(tenantId)
  const updateContact = useUpdateContact(tenantId)
  const archiveContact = useArchiveContact(tenantId)

  const [formOpen, setFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<ApiContactListItem | null>(null)
  const [archivingContact, setArchivingContact] = useState<ApiContactListItem | null>(null)

  const apiContacts = contactsQuery.data ?? []
  const contacts = apiContacts.map(mapContactToListItem)

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
      enqueueSnackbar(errorMessage(error, t('contactForm.saveError')), { variant: 'error' })
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
        contacts={contacts}
        totalCount={contacts.length}
        onNewContact={openCreateDialog}
        onEditContact={openEditDialog}
        onOpenMoreOptions={openArchiveDialog}
      />

      <ContactFormDialog
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

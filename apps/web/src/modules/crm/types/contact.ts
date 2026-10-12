export type ContactType = 'Proprietário' | 'Locatário' | 'Corretor'
export type ContactFilterKey = 'all' | 'owners' | 'tenants' | 'brokers'

import type { ContactFormValues } from '../schemas/contact-schema'

export type ApiContactType = 'PROPRIETARIO' | 'LOCATARIO' | 'CORRETOR'

export interface ApiContact {
  id: string
  tenantId: string
  name: string
  email: string
  phone: string | null
  type: ApiContactType
  avatarUrl: string | null
  notes: string | null
  lastInteraction: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ApiContactListItem extends ApiContact {
  propertyCount: number
}

export interface ContactFilters {
  type?: ApiContactType
  q?: string
  includeArchived?: boolean
}

export interface CreateContactPayload {
  name: string
  email: string
  phone?: string | null
  type?: ApiContactType
  avatarUrl?: string | null
  notes?: string | null
}

export interface UpdateContactPayload {
  name?: string
  email?: string
  phone?: string | null
  type?: ApiContactType
  avatarUrl?: string | null
  notes?: string | null
}

export interface UpdateContactInput {
  id: string
  changes: UpdateContactPayload
}

export type ContactListItem = {
  id: string
  name: string
  type: ContactType
  phone: string
  email: string
  propertyCount: number
  lastInteraction: string
  avatarUrl: string
}

export type ContactsPageResult = {
  items: ContactListItem[]
  page: number
  pageCount: number
  totalCount: number
}

export type ContactFilter = 'Todos' | 'Proprietários' | 'Locatários' | 'Corretores'

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

export type ContactActionsProps = Pick<
  ContactsListProps,
  'onEditContact' | 'onOpenInteractions' | 'onOpenMoreOptions'
> & {
  contact: ContactListItem
}

export type ContactAvatarProps = {
  contact: ContactListItem
}

export type ContactTypeChipProps = {
  type: ContactType
}

export type ContactsTableProps = {
  contacts: readonly ContactListItem[]
} & Pick<ContactsListProps, 'onEditContact' | 'onOpenInteractions' | 'onOpenMoreOptions'>

export type ContactsCardsProps = ContactsTableProps

export type ContactsHeaderProps = {
  search: string
  onSearchChange: (search: string) => void
  onNewContact?: () => void
}

export type ContactsStatusFiltersProps = {
  activeFilter: ContactFilter
  contacts: readonly ContactListItem[]
  onFilterChange: (filter: ContactFilter) => void
}

export type ArchiveContactDialogProps = {
  open: boolean
  isPending: boolean
  onClose: () => void
  onConfirm: () => void
}

export type ContactFormDialogProps = {
  open: boolean
  initialValues: ContactFormValues | null
  isPending: boolean
  onClose: () => void
  onSave: (values: ContactFormValues) => void
}

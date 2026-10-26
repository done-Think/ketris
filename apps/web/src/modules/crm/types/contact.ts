import type {
  ContactDTO,
  ContactListItemDTO,
  CreateContactRequestDTO,
  ListContactsQueryDTO,
  PatchContactRequestDTO,
} from '@server/crm/types/dto'
import type { z } from 'zod'

import type { createContactFormSchema } from '../schemas/contact-schema'

export type ContactType = 'PROPRIETARIO' | 'LOCATARIO' | 'CORRETOR'
export type ContactFilterKey = 'all' | 'owners' | 'tenants' | 'brokers'

export type ContactFormValues = z.infer<ReturnType<typeof createContactFormSchema>>

export type ApiContactType = 'PROPRIETARIO' | 'LOCATARIO' | 'CORRETOR'

export type ApiContact = ContactDTO

export type ApiContactListItem = ContactListItemDTO

export type ContactFilters = ListContactsQueryDTO

export type CreateContactPayload = CreateContactRequestDTO

export type UpdateContactPayload = PatchContactRequestDTO

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

export type ContactFilter = 'ALL' | 'PROPRIETARIO' | 'LOCATARIO' | 'CORRETOR'

export type ContactsListProps = {
  search?: string
  activeFilter?: ContactFilter
  counts?: Partial<Record<ContactFilter, number>>
  rowsPerPage?: number
  onSearchChange?: (value: string) => void
  onFilterChange?: (value: ContactFilter) => void
  onRowsPerPageChange?: (value: number) => void
  isLoading?: boolean
  error?: boolean
  onRetry?: () => void
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
  counts: Partial<Record<ContactFilter, number>>
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

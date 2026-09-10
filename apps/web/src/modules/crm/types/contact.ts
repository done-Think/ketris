export type ContactType = 'Proprietário' | 'Locatário' | 'Corretor'
export type ContactFilterKey = 'all' | 'owners' | 'tenants' | 'brokers'

/** Shape real da API (/crm/contacts) — enum sem acento, nulos explícitos, datas como ISO string. */
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
  selectedIds: ReadonlySet<string>
  onToggleContact: (contactId: string) => void
  onToggleAll: () => void
} & Pick<ContactsListProps, 'onEditContact' | 'onOpenInteractions' | 'onOpenMoreOptions'>

export type ContactsCardsProps = Omit<ContactsTableProps, 'onToggleAll'>

export type ContactsHeaderProps = {
  search: string
  activeFilter: ContactFilter
  onSearchChange: (search: string) => void
  onFilterChange: (filter: ContactFilter) => void
  onNewContact?: () => void
}

export type ContactsPaginationFooterProps = {
  firstVisible: number
  lastVisible: number
  resultTotal: number
  page: number
  canGoBack: boolean
  canGoForward: boolean
  onPageChange?: (page: number) => void
}

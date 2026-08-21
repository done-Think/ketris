export type ContactType = 'owner' | 'renter' | 'broker'

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

export type ContactFilterId = 'all' | ContactType

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
  activeFilterId: ContactFilterId
  onSearchChange: (search: string) => void
  onFilterChange: (filterId: ContactFilterId) => void
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

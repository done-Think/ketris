export type ContactType = 'Proprietário' | 'Locatário' | 'Corretor'

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

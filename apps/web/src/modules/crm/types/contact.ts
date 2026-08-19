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

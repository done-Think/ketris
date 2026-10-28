export type ContactType = 'OWNER' | 'RENTER' | 'BROKER'

export interface Contact {
  createdById?: string | null
  id: string
  tenantId: string
  name: string
  email: string
  phone: string | null
  type: ContactType
  avatarUrl: string | null
  notes: string | null
  lastInteraction: Date | null
  archivedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface ContactListItem extends Contact {
  propertyCount: number
}

export interface NewContact {
  tenantId: string
  name: string
  email: string
  phone: string | null
  type: ContactType
  avatarUrl: string | null
  notes: string | null
}

export interface ContactUpdate {
  name?: string
  email?: string
  phone?: string | null
  type?: ContactType
  avatarUrl?: string | null
  notes?: string | null
  lastInteraction?: Date | null
}

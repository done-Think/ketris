import type { PropertyAddress, Property, PropertyMedia, Prisma } from '@prisma/client'

export type PropertyRow = Property & {
  responsible: { name: string }
  ownerContact: { id: string; name: string } | null
  contracts: { id: string }[]
  address: PropertyAddress | null
  media: PropertyMedia[]
}

export type PropertyTransaction = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

export interface PropertyIdRow {
  id: string
}

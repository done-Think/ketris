import type { Charge, ChargeReceipt, Contract, Property, ContractParty } from '@prisma/client'

export type ChargeWithRelations = Charge & {
  currentReceipt: Pick<
    ChargeReceipt,
    'id' | 'fileName' | 'contentType' | 'sizeBytes' | 'createdAt'
  > | null
  contract:
    | (Contract & {
        property: Pick<Property, 'id' | 'title'> & {
          address: { street: string; neighborhood: string; city: string } | null
        }
        parties: Pick<ContractParty, 'name' | 'email'>[]
      })
    | null
}

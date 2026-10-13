import type { Endereco, Imovel, Midia, Prisma } from '@prisma/client'

export type PropertyRow = Imovel & {
  endereco: Endereco | null
  midias: Midia[]
}

export type PropertyTransaction = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

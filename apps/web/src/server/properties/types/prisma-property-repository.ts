import type { Endereco, Imovel, Midia, Prisma } from '@prisma/client'

export type PropertyRow = Imovel & {
  responsavel: { nome: string }
  contratos: { id: string }[]
  endereco: Endereco | null
  midias: Midia[]
}

export type PropertyTransaction = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

export interface PropertyIdRow {
  id: string
}

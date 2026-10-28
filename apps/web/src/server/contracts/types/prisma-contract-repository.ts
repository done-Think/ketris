import type { Prisma, User } from '@prisma/client'
import type { contractInclude } from '../infrastructure/contract-query'

export type UserRef = Pick<User, 'id' | 'name'>
export type ContractWithRelations = Prisma.ContractGetPayload<{ include: typeof contractInclude }>

export type DocumentWithRelations = ContractWithRelations['documents'][number]

export interface ContractIdRow {
  id: string
}
export interface ContractCodeSequenceRow {
  max: number | bigint | null
}

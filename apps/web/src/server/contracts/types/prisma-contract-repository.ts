import type { Prisma, Usuario } from '@prisma/client'
import type { contractInclude } from '../infrastructure/contract-query'

export type UsuarioRef = Pick<Usuario, 'id' | 'nome'>
export type ContratoWithRelations = Prisma.ContratoGetPayload<{ include: typeof contractInclude }>

export type DocumentoWithRelations = ContratoWithRelations['documentos'][number]

export interface ContractIdRow {
  id: string
}
export interface ContractCodeSequenceRow {
  max: number | bigint | null
}

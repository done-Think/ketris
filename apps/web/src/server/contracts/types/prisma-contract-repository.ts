import type { Assinatura, Contrato, ParteContrato } from '@prisma/client'

export type ContratoWithRelations = Contrato & {
  partes: (ParteContrato & { assinatura: Assinatura | null })[]
  documentos: { id: string; nome: string; url: string | null; createdAt: Date }[]
}

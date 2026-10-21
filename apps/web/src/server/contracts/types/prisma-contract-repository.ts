import type { Assinatura, Contrato, ParteContrato } from '@prisma/client'

export type UsuarioRef = { id: string; nome: string }

export type ContratoWithRelations = Contrato & {
  ativadoPor: UsuarioRef | null
  partes: (ParteContrato & {
    assinatura: (Assinatura & { assinadaPor: UsuarioRef | null }) | null
  })[]
  documentos: { id: string; nome: string; url: string | null; createdAt: Date }[]
}

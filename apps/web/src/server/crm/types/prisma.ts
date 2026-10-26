import type { AtividadeOportunidade, Contato, Lead, Oportunidade, Prisma } from '@prisma/client'
import type { Papel } from '@server/auth/domain/user.entity'

export type CrmDatabase = Prisma.TransactionClient
export type ContatoRow = Contato
export type LeadRow = Lead
export type OportunidadeRow = Oportunidade
export type AtividadeRow = AtividadeOportunidade

export interface CrmScope {
  actorTenantId: string
  actorId?: string | null
  actorPapel: Papel
}

export interface CrmUseCase<Input, Output> {
  execute(input: Input): Promise<Output>
}

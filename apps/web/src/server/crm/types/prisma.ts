import type { OpportunityActivity, Contact, Lead, Opportunity, Prisma } from '@prisma/client'
import type { UserRole } from '@server/auth/domain/user.entity'

export type CrmDatabase = Prisma.TransactionClient
export type ContactRow = Contact
export type LeadRow = Lead
export type OpportunityRow = Opportunity & { responsible: { name: string } }
export type ActivityRow = OpportunityActivity

export interface CrmScope {
  actorTenantId: string
  actorId?: string | null
  actorRole: UserRole
}

export interface CrmUseCase<Input, Output> {
  execute(input: Input): Promise<Output>
}

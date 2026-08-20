import type { z } from 'zod'

import type {
  contractGuaranteeSchema,
  editOpportunityFormSchema,
  opportunityFiltersSchema,
  opportunityStatusSchema,
  updateOpportunitySchema,
} from '../schemas/opportunity-schema'

export type OpportunityStatus = z.infer<typeof opportunityStatusSchema>
export type ContractGuarantee = z.infer<typeof contractGuaranteeSchema>
export type OpportunityFilters = z.infer<typeof opportunityFiltersSchema>
export type UpdateOpportunityPayload = z.infer<typeof updateOpportunitySchema>
export type OpportunityEditFormValues = z.infer<typeof editOpportunityFormSchema>

export interface Opportunity {
  id: string
  tenantId: string
  imovelId: string
  interessadoNome: string
  interessadoEmail: string
  interessadoTelefone: string | null
  valorProposto: number
  prazoContratoMeses: number | null
  inicioPretendido: string | null
  garantiaContratual: ContractGuarantee
  condicoesEspeciais: string[]
  observacoes: string | null
  status: OpportunityStatus
  arquivadaEm: string | null
  createdAt: string
  updatedAt: string
}

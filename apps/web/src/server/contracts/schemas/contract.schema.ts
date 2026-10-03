import '@server/openapi/zod-extend'
import { z } from 'zod'

export const contractStatusSchema = z.enum([
  'RASCUNHO',
  'EM_REVISAO',
  'AGUARDANDO_ASSINATURA',
  'ASSINADO',
  'ATIVO',
  'ENCERRADO',
  'CANCELADO',
])

export const contractTypeSchema = z.enum(['RESIDENCIAL', 'COMERCIAL', 'TEMPORADA'])

export const adjustmentIndexSchema = z.enum(['IPCA', 'IGPM', 'INPC'])

export const contractGuaranteeTypeSchema = z.enum([
  'FIADOR',
  'CAUCAO',
  'SEGURO_FIANCA',
  'TITULO_CAPITALIZACAO',
])

export const contractPartyRoleSchema = z.enum(['LOCADOR', 'LOCATARIO', 'FIADOR'])

export const signatureStatusSchema = z.enum(['PENDENTE', 'ASSINADA'])

export const contractPartySchema = z
  .object({
    id: z.string(),
    role: contractPartyRoleSchema,
    name: z.string(),
    cpf: z.string(),
    email: z.string(),
    phone: z.string().nullable(),
    signatureStatus: signatureStatusSchema,
    signedAt: z.string().nullable(),
  })
  .openapi('ContractParty')

export const contractDocumentSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    url: z.string().nullable(),
    createdAt: z.string(),
  })
  .openapi('ContractDocument')

export const contractSchema = z
  .object({
    id: z.string(),
    propertyId: z.string(),
    opportunityId: z.string(),
    code: z.string(),
    type: contractTypeSchema,
    amount: z.number(),
    dueDay: z.number().int(),
    startDate: z.string(),
    endDate: z.string(),
    adjustmentIndex: adjustmentIndexSchema,
    guaranteeType: contractGuaranteeTypeSchema,
    notes: z.string().nullable(),
    status: contractStatusSchema,
    activatedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    parties: z.array(contractPartySchema),
    documents: z.array(contractDocumentSchema),
  })
  .openapi('Contract')

export const contractListItemSchema = z
  .object({
    id: z.string(),
    code: z.string(),
    opportunityId: z.string(),
    propertyId: z.string(),
    propertyTitle: z.string(),
    propertyAddress: z.string(),
    ownerName: z.string().nullable(),
    tenantName: z.string().nullable(),
    status: contractStatusSchema,
    type: contractTypeSchema,
    amount: z.number(),
    startDate: z.string(),
    endDate: z.string(),
    updatedAt: z.string(),
  })
  .openapi('ContractListItem')

export const contractIdParamsSchema = z.object({ id: z.string() }).openapi('ContractIdParams')

export const contractPartyIdParamsSchema = z
  .object({ id: z.string(), partyId: z.string() })
  .openapi('ContractPartyIdParams')

export const contractResponseSchema = z
  .object({ contract: contractSchema })
  .openapi('ContractResponse')

export const contractsResponseSchema = z
  .object({ items: z.array(contractListItemSchema), totalCount: z.number() })
  .openapi('ContractsResponse')

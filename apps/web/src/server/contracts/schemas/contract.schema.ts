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

export const contractActorSchema = z
  .object({ id: z.string(), name: z.string() })
  .openapi('ContractActor')

export const contractPartySchema = z
  .object({
    id: z.string(),
    userId: z.string().nullable(),
    role: contractPartyRoleSchema,
    name: z.string(),
    cpf: z.string(),
    email: z.string(),
    phone: z.string().nullable(),
    signatureStatus: signatureStatusSchema,
    signedAt: z.string().nullable(),
    signedBy: contractActorSchema
      .nullable()
      .openapi({ description: 'Usuário da imobiliária que registrou a assinatura.' }),
    signatureMethod: z.enum(['MANUAL', 'PROVIDER']).nullable(),
    signatureDocumentId: z.string().nullable(),
    signatureDocumentHash: z.string().nullable(),
    createdAt: z.string().nullable(),
    updatedAt: z.string().nullable(),
  })
  .openapi('ContractParty')

export const contractPartyUserLinkSchema = z
  .object({ partyId: z.string(), userId: z.string() })
  .openapi('ContractPartyUserLink')

export const contractDocumentSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    url: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string().nullable(),
    sha256: z.string().nullable(),
    size: z.number().int().nullable(),
    uploadedBy: contractActorSchema.nullable(),
    contractRevision: z.number().int().nullable(),
    canDownload: z.boolean(),
  })
  .openapi('ContractDocument')

export const contractSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    propertyId: z.string(),
    property: z.object({ title: z.string(), address: z.string() }),
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
    activatedBy: contractActorSchema
      .nullable()
      .openapi({ description: 'Usuário que registrou a última assinatura e ativou o contrato.' }),
    createdAt: z.string(),
    updatedAt: z.string(),
    dataRevision: z.number().int().nonnegative(),
    createdBy: contractActorSchema.nullable(),
    cancelledAt: z.string().nullable(),
    cancelledBy: contractActorSchema.nullable(),
    cancellationReason: z.string().nullable(),
    closedAt: z.string().nullable(),
    closedBy: contractActorSchema.nullable(),
    closingReason: z.string().nullable(),
    parties: z.array(contractPartySchema),
    documents: z.array(contractDocumentSchema),
  })
  .openapi('Contract')

export const contractListItemSchema = z
  .object({
    canEdit: z.boolean(),
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
  .object({
    items: z.array(contractListItemSchema),
    totalCount: z.number(),
    summary: z.object({
      total: z.number(),
      active: z.number(),
      expiring30: z.number(),
      expiring90: z.number(),
      closed: z.number(),
    }),
  })
  .openapi('ContractsResponse')

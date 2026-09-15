import '@server/openapi/zod-extend'
import { z } from 'zod'

export const opportunityStatusSchema = z
  .enum(['RASCUNHO', 'ENVIADA', 'EM_NEGOCIACAO', 'ACEITA', 'RECUSADA'])
  .openapi('OpportunityStatus')

export const guaranteeTypeSchema = z
  .enum(['FIADOR', 'CAUCAO', 'SEGURO_FIANCA', 'NENHUMA'])
  .openapi('GuaranteeType')

export const opportunitySchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    propertyId: z.string(),
    contactId: z.string().nullable(),
    leadName: z.string(),
    leadEmail: z.string().email(),
    leadPhone: z.string().nullable(),
    proposedValue: z.number(),
    contractTermMonths: z.number().int().nullable(),
    desiredStartDate: z.coerce.date().nullable(),
    guaranteeType: guaranteeTypeSchema,
    specialConditions: z.array(z.string()),
    notes: z.string().nullable(),
    status: opportunityStatusSchema,
    archivedAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .openapi('Opportunity')

export const listOpportunitiesQuerySchema = z
  .object({
    status: opportunityStatusSchema.optional(),
    contactId: z.string().optional(),
    includeArchived: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
  })
  .openapi('ListOpportunitiesQuery')

export const listOpportunitiesResponseSchema = z
  .object({ opportunities: z.array(opportunitySchema) })
  .openapi('ListOpportunitiesResponse')

export const opportunityResponseSchema = z
  .object({ opportunity: opportunitySchema })
  .openapi('OpportunityResponse')

const leadName = z.string().min(1, 'Nome é obrigatório.')
const leadEmail = z.string().email('E-mail inválido.')
const leadPhone = z.string().min(1).nullable()
const proposedValue = z.number().positive('Valor proposto deve ser positivo.')
const contractTermMonths = z.number().int().positive().nullable()
const desiredStartDate = z.coerce.date().nullable()
const specialConditions = z.array(z.string().min(1))
const notes = z.string().min(1).nullable()
const contactId = z.string().min(1).nullable()

export const createOpportunityRequestSchema = z
  .object({
    propertyId: z.string().min(1, 'Imóvel é obrigatório.'),
    contactId: z.string().min(1).optional(),
    leadName,
    leadEmail,
    leadPhone: leadPhone.optional(),
    proposedValue,
    notes: notes.optional(),
    // Deliberately restricted: a manually created opportunity enters at the top of the funnel
    // (RASCUNHO/prospecting) or already ENVIADA (a lead logged outside the marketplace, but
    // already formalized). ACEITA/EM_NEGOCIACAO/RECUSADA as an initial state would skip the
    // timeline that justifies reaching them.
    status: z.enum(['RASCUNHO', 'ENVIADA']).optional(),
  })
  .openapi('CreateOpportunityRequest')

export type CreateOpportunityRequestDTO = z.infer<typeof createOpportunityRequestSchema>

export const putOpportunityRequestSchema = z
  .object({
    contactId: contactId.optional(),
    leadName,
    leadEmail,
    leadPhone: leadPhone.optional(),
    proposedValue,
    contractTermMonths: contractTermMonths.optional(),
    desiredStartDate: desiredStartDate.optional(),
    guaranteeType: guaranteeTypeSchema.optional(),
    specialConditions: specialConditions.optional(),
    notes: notes.optional(),
    status: opportunityStatusSchema,
  })
  .openapi('PutOpportunityRequest')

export const patchOpportunityRequestSchema = z
  .object({
    contactId: contactId.optional(),
    leadName: leadName.optional(),
    leadEmail: leadEmail.optional(),
    leadPhone: leadPhone.optional(),
    proposedValue: proposedValue.optional(),
    contractTermMonths: contractTermMonths.optional(),
    desiredStartDate: desiredStartDate.optional(),
    guaranteeType: guaranteeTypeSchema.optional(),
    specialConditions: specialConditions.optional(),
    notes: notes.optional(),
    status: opportunityStatusSchema.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Informe ao menos um campo para atualizar.',
  })
  .openapi('PatchOpportunityRequest')

export const deleteOpportunityQuerySchema = z
  .object({
    permanent: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
  })
  .openapi('DeleteOpportunityQuery')

export type PutOpportunityRequestDTO = z.infer<typeof putOpportunityRequestSchema>
export type PatchOpportunityRequestDTO = z.infer<typeof patchOpportunityRequestSchema>

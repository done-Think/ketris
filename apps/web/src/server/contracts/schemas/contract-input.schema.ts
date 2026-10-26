import '@server/openapi/zod-extend'
import { z } from 'zod'
import { contractDateSchema } from './contract-date.schema'
import { createPhoneSchema } from '@shared/schemas/phone-schema'
import { createCpfSchema } from '@shared/schemas/cpf-schema'
import {
  adjustmentIndexSchema,
  contractGuaranteeTypeSchema,
  contractStatusSchema,
  contractTypeSchema,
} from './contract.schema'

const contractPartyInputSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    cpf: createCpfSchema((key) =>
      key === 'cpfRequired' ? 'Informe o CPF.' : 'Informe um CPF válido.',
    ),
    email: z.string().trim().email().max(254),
    phone: createPhoneSchema((key) =>
      key === 'phoneRequired' ? 'Informe o telefone.' : 'Informe um telefone válido.',
    ).refine((value) => value.length <= 32, 'Use até 32 caracteres.'),
  })
  .strict()

export const linkContractPartyUserRequestSchema = z
  .object({ email: z.string().trim().email().max(254) })
  .strict()
  .openapi('LinkContractPartyUserRequest')

export const contractAmountSchema = z
  .number()
  .min(0.01, 'O valor mínimo é 0,01.')
  .max(9999999999.99, 'O valor excede o limite do contrato.')
  .multipleOf(0.01, 'Use no máximo duas casas decimais.')

export const createContractRequestSchema = z
  .object({
    opportunityId: z.string().trim().min(1),
    amount: contractAmountSchema.optional(),
    type: contractTypeSchema,
    dueDay: z.number().int().min(1).max(31),
    startDate: contractDateSchema,
    endDate: contractDateSchema,
    adjustmentIndex: adjustmentIndexSchema,
    guaranteeType: contractGuaranteeTypeSchema,
    notes: z.string().trim().min(1).max(10000).nullable().optional(),
    owner: contractPartyInputSchema,
    tenant: contractPartyInputSchema,
    guarantor: contractPartyInputSchema.nullable().optional(),
  })
  .strict()
  .refine((value) => value.endDate > value.startDate, {
    message: 'A data de término deve ser posterior à data de início.',
    path: ['endDate'],
  })
  .openapi('CreateContractRequest')

export const listContractsQuerySchema = z
  .object({
    status: contractStatusSchema.optional(),
    type: contractTypeSchema.optional(),
    propertyId: z.string().trim().min(1).optional(),
    search: z.string().trim().min(1).max(500).optional(),
    period: z.enum(['ALL', 'THIS_MONTH', 'NEXT_90_DAYS']).optional(),
    sortBy: z
      .enum(['property', 'tenant', 'amount', 'startDate', 'endDate', 'status', 'updatedAt'])
      .optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    locale: z.enum(['pt-BR', 'en-US', 'es-ES']).optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  })
  .strict()
  .openapi('ListContractsQuery')

import '@server/openapi/zod-extend'
import { z } from 'zod'

import { platformTenantSchema, tenantAccountTypeSchema } from './tenant.schema'

export const platformFinanceResponseSchema = z
  .object({
    referenceDate: z.string().openapi({ description: 'ISO 8601: data usada para o mês corrente.' }),
    mrr: z.number().openapi({
      description: 'Soma das mensalidades das contas ACTIVE, em BRL (calculada pelos planos).',
    }),
    payingAccounts: z.number().int(),
    trialAccounts: z.number().int(),
    suspendedAccounts: z.number().int(),
    canceledThisMonth: z.number().int(),
    churnRate: z.number().nullable().openapi({
      description:
        'Fração (0–1) das contas da base no dia 1 do mês que cancelaram no mês. null sem base.',
    }),
    byAccountType: z.array(
      z.object({
        accountType: tenantAccountTypeSchema,
        activeAccounts: z.number().int(),
        mrr: z.number(),
      }),
    ),
    accounts: z.array(platformTenantSchema),
  })
  .openapi('PlatformFinanceResponse')

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
    canceledThisMonth: z.number().int().openapi({
      description: 'Contas da base do churn que cancelaram no mês (cada conta conta uma vez).',
    }),
    churnBaseAccounts: z
      .number()
      .int()
      .openapi({
        description:
          'Base do churn: contas pagantes (ACTIVE) às 00:00 do dia 1 do mês, no fuso ' +
          'America/Sao_Paulo. TRIAL e SUSPENDED não entram (não estavam pagando).',
      }),
    churnRate: z
      .number()
      .nullable()
      .openapi({
        description:
          'canceledThisMonth / churnBaseAccounts (0–1), calculado pelo histórico de situações: ' +
          'uma reativação posterior não altera o churn de um mês. null sem base.',
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

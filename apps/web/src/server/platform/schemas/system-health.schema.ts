import '@server/openapi/zod-extend'
import { z } from 'zod'

const errorTrackingIssueSchema = z.object({
  id: z.string(),
  title: z.string(),
  level: z.string().openapi({ example: 'error' }),
  eventsCount: z.number().int(),
  lastSeen: z.string().openapi({ description: 'ISO 8601' }),
  permalink: z.string().openapi({ description: 'Link do issue no Sentry.' }),
})

export const systemHealthResponseSchema = z
  .object({
    checkedAt: z.string().openapi({ description: 'ISO 8601' }),
    database: z.object({
      status: z.enum(['up', 'down']),
      latencyMs: z.number().int().nullable().openapi({
        description: 'Tempo de resposta de um SELECT 1, medido agora. null quando fora do ar.',
      }),
    }),
    serverUptimeSeconds: z.number().int().openapi({
      description:
        'Há quanto tempo esta instância do servidor está no ar (não é disponibilidade %).',
    }),
    errorTracking: z
      .union([
        z.object({ configured: z.literal(false) }),
        z.object({ configured: z.literal(true), available: z.literal(false) }),
        z.object({
          configured: z.literal(true),
          available: z.literal(true),
          issues: z.array(errorTrackingIssueSchema),
        }),
      ])
      .openapi({
        description:
          'Erros não resolvidos das últimas 24h no Sentry. configured=false sem SENTRY_API_TOKEN; ' +
          'available=false quando o Sentry não respondeu.',
      }),
  })
  .openapi('SystemHealthResponse')

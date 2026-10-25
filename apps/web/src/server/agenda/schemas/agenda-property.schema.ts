import '@server/openapi/zod-extend'
import { z } from 'zod'

export const listAgendaPropertiesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(1000000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
    search: z.string().trim().max(500).optional(),
  })
  .strict()
  .openapi('ListAgendaPropertiesQuery')
export const agendaPropertyOptionsResponseSchema = z
  .object({
    items: z.array(z.object({ id: z.string(), label: z.string() })),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  })
  .openapi('AgendaPropertyOptionsResponse')

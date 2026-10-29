import { z } from 'zod'

export const crmListQuerySchema = z.object({
  q: z.string().trim().max(500).optional(),
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .refine((size) => [5, 10, 25].includes(size))
    .default(5),
  sortBy: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
  locale: z.enum(['pt-BR', 'en-US', 'es-ES']).default('pt-BR'),
})
export const crmPaginationSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  pageCount: z.number().int(),
  totalCount: z.number().int(),
})
export const crmGroupsSchema = z.array(
  z.object({
    key: z.string(),
    count: z.number(),
    amount: z.number(),
    rental: z.number(),
    sale: z.number(),
    unclassified: z.number(),
  }),
)

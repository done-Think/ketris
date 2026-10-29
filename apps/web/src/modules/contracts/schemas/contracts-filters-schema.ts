import { z } from 'zod'

export const contractsFiltersSchema = z.object({
  searchQuery: z.string().default(''),
  status: z
    .enum([
      'ALL',
      'DRAFT',
      'IN_REVIEW',
      'AWAITING_SIGNATURE',
      'SIGNED',
      'ACTIVE',
      'CLOSED',
      'CANCELED',
    ])
    .default('ALL'),
  type: z.enum(['ALL', 'RESIDENTIAL', 'COMMERCIAL', 'SEASONAL']).default('ALL'),
  period: z.enum(['ALL', 'THIS_MONTH', 'NEXT_90_DAYS']).default('ALL'),
})

export const contractsFiltersDefaultValues = {
  searchQuery: '',
  status: 'ALL',
  type: 'ALL',
  period: 'ALL',
} satisfies z.infer<typeof contractsFiltersSchema>

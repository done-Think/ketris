import { z } from 'zod'

export const directorySearchQuerySchema = z.string().trim().max(80)

export const directorySearchFormSchema = z.object({
  isLoadingMore: z.boolean(),
  searchQuery: directorySearchQuerySchema,
  visibleCount: z.number().int().min(0),
})

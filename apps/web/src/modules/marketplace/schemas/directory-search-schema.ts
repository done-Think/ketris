import { z } from 'zod'

export type SchemaMessageTranslator = (key: string) => string

export function createDirectorySearchFormSchema(t: SchemaMessageTranslator) {
  return z.object({
    isLoadingMore: z.boolean(),
    searchQuery: z.string().trim().max(80, t('searchQueryTooLong')),
    visibleCount: z.number().int().min(0, t('visibleCountInvalid')),
  })
}

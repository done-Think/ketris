import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

export function createDirectorySearchFormSchema(t: SchemaMessageTranslator) {
  return z.object({
    searchQuery: z.string().trim().max(80, t('searchQueryTooLong')),
  })
}

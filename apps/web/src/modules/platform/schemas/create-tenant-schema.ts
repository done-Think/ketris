import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export function createTenantSchema(t: SchemaMessageTranslator) {
  return z.object({
    nome: z.string().min(1, t('nameRequired')),
    slug: z.string().min(1, t('slugRequired')).regex(SLUG_PATTERN, t('slugInvalid')),
  })
}

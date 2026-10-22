import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

import { TENANT_ACCOUNT_TYPES } from '../types/tenant'

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export function createTenantSchema(t: SchemaMessageTranslator) {
  return z.object({
    name: z.string().min(1, t('nameRequired')),
    slug: z.string().min(1, t('slugRequired')).regex(SLUG_PATTERN, t('slugInvalid')),
    accountType: z.enum(TENANT_ACCOUNT_TYPES),
    startAsTrial: z.boolean(),
  })
}

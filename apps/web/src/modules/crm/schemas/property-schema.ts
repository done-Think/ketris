import type { SchemaMessageTranslator } from '@shared/types'
import { z } from 'zod'
import type { CrmPropertySummary } from '../types/property'

export function createPropertySelectionSchema(t: SchemaMessageTranslator<'propertyRequired'>) {
  return z
    .custom<CrmPropertySummary>(
      (value) =>
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        typeof value.id === 'string' &&
        value.id.trim().length > 0,
      t('propertyRequired'),
    )
    .nullable()
    .refine((value): boolean => value !== null, t('propertyRequired'))
}

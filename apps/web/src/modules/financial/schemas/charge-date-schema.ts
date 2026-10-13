import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

export function createChargeDateSchema(t: SchemaMessageTranslator) {
  return z.string().date(t('dateInvalid'))
}

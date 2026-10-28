import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

export function createChargeDateSchema(t: SchemaMessageTranslator<'dateInvalid'>) {
  return z.string().date(t('dateInvalid'))
}

import type { SchemaMessageTranslator } from '@shared/types'
import { z } from 'zod'

export function createMaintenanceNoteSchema(t: SchemaMessageTranslator<'required' | 'tooLong'>) {
  return z.object({ message: z.string().trim().min(1, t('required')).max(10000, t('tooLong')) })
}

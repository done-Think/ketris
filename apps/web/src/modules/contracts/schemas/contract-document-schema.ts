import { z } from 'zod'
import type { SchemaMessageTranslator } from '@shared/types'

export function createContractDocumentSchema(
  t: SchemaMessageTranslator<'pdf' | 'required' | 'size'>,
) {
  return z.object({
    file: z
      .custom<File>((value) => value instanceof File, t('required'))
      .refine((file) => !file || (file.size > 0 && file.size <= 10 * 1024 * 1024), t('size'))
      .refine(
        (file) => !file || (file.type === 'application/pdf' && /\.pdf$/i.test(file.name)),
        t('pdf'),
      ),
  })
}

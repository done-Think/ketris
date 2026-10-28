import type { SchemaMessageTranslator } from '@shared/types'
import type { TranslationKey } from '@/i18n/types/messages.types'

const knownFields = [
  'type',
  'amount',
  'dueDay',
  'adjustmentIndex',
  'guaranteeType',
  'notes',
  'startDate',
  'endDate',
  'parties',
  'status',
  'documents',
] as const

const translationKeys = new Map<string, TranslationKey<'contracts.history'>>(
  knownFields.map((field) => [field, `fields.${field}`]),
)

export function contractHistoryFields(
  fields: string[],
  t: SchemaMessageTranslator<TranslationKey<'contracts.history'>>,
) {
  return [
    ...new Set(
      fields.map((field) => {
        const key = field.startsWith('parties.')
          ? 'fields.parties'
          : (translationKeys.get(field) ?? 'fields.other')
        return t(key)
      }),
    ),
  ].join(', ')
}

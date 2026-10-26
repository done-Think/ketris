import type { SchemaMessageTranslator } from '@shared/types'

const knownFields = new Set([
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
])

export function contractHistoryFields(fields: string[], t: SchemaMessageTranslator) {
  return [
    ...new Set(
      fields.map((field) => {
        const key = field.startsWith('parties.')
          ? 'parties'
          : knownFields.has(field)
            ? field
            : 'other'
        return t('fields.' + key)
      }),
    ),
  ].join(', ')
}

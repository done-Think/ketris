import { chargeHistoryFields } from '../config/charge-history-fields'

export function normalizeChargeHistoryFields(fields: readonly string[]): string[] {
  return fields.map((field) => chargeHistoryFields.get(field) ?? field)
}

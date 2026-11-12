/** Brazilian CEP formatting follows the property's country, independently of the UI language. */
export function normalizePostalCode(value: string): string | null {
  const digits = value.replace(/[.\s-]/g, '')
  return /^\d{8}$/.test(digits) ? digits : null
}

const lowestPostalCodePrefix = 1000

export function isValidPostalCode(value: string): boolean {
  const digits = normalizePostalCode(value)
  if (!digits) return false
  if (/^(\d)\1{7}$/.test(digits)) return false
  return Number(digits.slice(0, 5)) >= lowestPostalCodePrefix
}

export function formatPostalCode(value: string): string {
  const digits = normalizePostalCode(value)
  return digits ? `${digits.slice(0, 5)}-${digits.slice(5)}` : value
}

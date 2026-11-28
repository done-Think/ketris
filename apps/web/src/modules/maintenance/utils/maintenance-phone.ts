// Providers may be saved with digits only, so show a 10 or 11 digit number with the Brazilian mask.
// Anything else (an international number, an extension) is shown as it was typed.
export function formatMaintenancePhone(value: string): string {
  if (!/^[\d\s()-]+$/.test(value)) return value
  const digits = value.replace(/\D/g, '')
  if (digits.length === 11)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  if (digits.length === 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return value
}

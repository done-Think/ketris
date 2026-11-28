/**
 * Normalized forms used to compare contact data, so "(35) 99999-9999" and "35999999999", or
 * "mg-12345-j" and "MG 12345 J", count as the same value.
 */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

export function phoneKey(phone: string | null | undefined): string | null {
  const key = digitsOnly(phone ?? '')
  return key || null
}

export function creciKey(creci: string | null | undefined): string | null {
  const key = (creci ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  return key || null
}

export function documentKey(value: string | null | undefined): string | null {
  return phoneKey(value)
}

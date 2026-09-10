import { z } from 'zod'

/**
 * Standard Brazilian CPF check-digit algorithm (two mod-11 digits over the first 9 digits).
 * Rejects the well-known invalid pattern of 11 repeated digits (e.g. "111.111.111-11"), which
 * always passes the checksum but is never a real CPF.
 */
export function isValidCpf(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false

  const calcCheckDigit = (base: string, startingFactor: number): number => {
    let total = 0
    let factor = startingFactor

    for (const char of base) {
      total += Number(char) * factor
      factor -= 1
    }

    const remainder = total % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  const base = digits.slice(0, 9)
  const firstCheckDigit = calcCheckDigit(base, 10)
  const secondCheckDigit = calcCheckDigit(base + firstCheckDigit, 11)

  return digits === `${base}${firstCheckDigit}${secondCheckDigit}`
}

export const cpfSchema = z
  .string()
  .trim()
  .min(1, 'Informe o CPF')
  .refine(isValidCpf, 'Informe um CPF válido')

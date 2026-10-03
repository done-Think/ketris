import { z } from 'zod'

import type { SchemaMessageTranslator } from './email-schema'

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

export function createCpfSchema(t: SchemaMessageTranslator) {
  return z.string().trim().min(1, t('cpfRequired')).refine(isValidCpf, t('cpfInvalid'))
}

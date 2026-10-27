import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

import { parseMoneyInput } from '../utils/money-input'

const MAX_MONEY = 999_999.99
const MAX_UNITS = 100_000

export function createPlatformPlanSchema(t: SchemaMessageTranslator, locale: string) {
  const money = z.string().refine((value) => {
    const amount = parseMoneyInput(value, locale)
    return amount !== null && amount <= MAX_MONEY
  }, t('invalidAmount'))

  return z.object({
    monthlyPrice: money,
    includedUnits: z
      .string()
      .refine(
        (value) => /^\d+$/.test(value.trim()) && Number(value) <= MAX_UNITS,
        t('invalidUnits'),
      ),
    extraUnitPrice: money,
  })
}

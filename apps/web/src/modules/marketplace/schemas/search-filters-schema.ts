import { z } from 'zod'

const optionalNumericField = z
  .string()
  .refine(
    (value) => value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0),
    'Informe um valor numérico válido',
  )

export const searchFiltersSchema = z.object({
  locationQuery: z.string(),
  propertyTypeFilter: z.string(),
  priceFilterIndex: z.number().int().nonnegative(),
  customMaxPrice: optionalNumericField,
  bedroomFilterIndex: z.number().int().nonnegative(),
  areaFilterIndex: z.number().int().nonnegative(),
  customMinArea: optionalNumericField,
  onlyWithParking: z.boolean(),
  sortOption: z.enum(['relevancia', 'menor-preco', 'maior-preco']),
})

export type SearchFiltersFormValues = z.infer<typeof searchFiltersSchema>

export function parseNumericFilter(value: string) {
  const parsed = Number(value)

  return value !== '' && Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

import { z } from 'zod'

export const searchResultsFiltersSchema = z.object({
  isFiltersOpen: z.boolean(),
  propertyTypeFilter: z.string(),
  priceFilterIndex: z.number().int().nonnegative(),
  customMaxPrice: z.string(),
  bedroomFilterIndex: z.number().int().nonnegative(),
  areaFilterIndex: z.number().int().nonnegative(),
  customMinArea: z.string(),
  onlyWithParking: z.boolean(),
})

export type SearchResultsFiltersFormValues = z.infer<typeof searchResultsFiltersSchema>

import { z } from 'zod'

const searchFilterKeySchema = z.enum(['location', 'propertyType', 'priceRange'])
const textSearchDraftSchema = z.object({
  location: z.string().trim().max(80),
  propertyType: z.string().trim().max(80),
})
const numericTextSchema = (maxLength: number) =>
  z.string().trim().max(maxLength).regex(/^\d*$/, 'Use apenas números')

export const marketplaceSearchFormSchema = z.object({
  activeSearchMenu: searchFilterKeySchema.nullable(),
  selectedSearch: z.object({
    location: z.string().trim().min(1).max(80),
    propertyType: z.string().trim().min(1).max(80),
    priceRange: z.string().trim().min(1).max(80),
  }),
  priceRange: z.tuple([z.number().min(0), z.number().min(0)]),
  searchDraft: textSearchDraftSchema,
})

export const searchResultsFormSchema = z.object({
  selectedPropertyId: z.string(),
  locationQuery: z.string().trim().max(80),
  propertyTypeFilter: z.string().trim().max(80),
  priceFilterIndex: z.number().int().min(0).max(2),
  customMaxPrice: numericTextSchema(12),
  bedroomFilterIndex: z.number().int().min(0).max(2),
  areaFilterIndex: z.number().int().min(0).max(2),
  customMinArea: numericTextSchema(8),
  onlyWithParking: z.boolean(),
  sortOption: z.enum(['relevancia', 'menor-preco', 'maior-preco']),
  viewMode: z.enum(['grid', 'list']),
})

export const searchResultsFiltersDialogFormSchema = z.object({
  isFiltersOpen: z.boolean(),
  propertyTypeFilter: z.string().trim().max(80),
  priceFilterIndex: z.number().int().min(0).max(2),
  customMaxPrice: numericTextSchema(12),
  bedroomFilterIndex: z.number().int().min(0).max(2),
  areaFilterIndex: z.number().int().min(0).max(2),
  customMinArea: numericTextSchema(8),
  onlyWithParking: z.boolean(),
})

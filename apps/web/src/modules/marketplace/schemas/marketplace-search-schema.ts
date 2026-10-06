import { z } from 'zod'

import { searchResultsViewModes } from '../config/search-results-view-mode'

export type SchemaMessageTranslator = (key: string) => string

const searchFilterKeySchema = z.enum(['location', 'propertyType', 'priceRange'])

const createTextSearchDraftSchema = (t: SchemaMessageTranslator) =>
  z.object({
    location: z.string().trim().max(80, t('textTooLong')),
    propertyType: z.string().trim().max(80, t('textTooLong')),
  })

const createNumericTextSchema = (t: SchemaMessageTranslator, maxLength: number) =>
  z.string().trim().max(maxLength, t('numberTooLong')).regex(/^\d*$/, t('numbersOnly'))

export function createMarketplaceSearchFormSchema(t: SchemaMessageTranslator) {
  return z.object({
    activeSearchMenu: searchFilterKeySchema.nullable(),
    selectedSearch: z.object({
      location: z.string().trim().min(1, t('optionRequired')).max(80, t('textTooLong')),
      propertyType: z.string().trim().min(1, t('optionRequired')).max(80, t('textTooLong')),
      priceRange: z.string().trim().min(1, t('optionRequired')).max(80, t('textTooLong')),
    }),
    priceRange: z.tuple([
      z.number().min(0, t('priceInvalid')),
      z.number().min(0, t('priceInvalid')),
    ]),
    searchDraft: createTextSearchDraftSchema(t),
  })
}

export function createSearchResultsFormSchema(t: SchemaMessageTranslator) {
  return z.object({
    selectedPropertyId: z.string(),
    locationQuery: z.string().trim().max(80, t('textTooLong')),
    propertyTypeFilter: z.string().trim().max(80, t('textTooLong')),
    priceFilterIndex: z.number().int().min(0, t('optionInvalid')).max(2, t('optionInvalid')),
    customMaxPrice: createNumericTextSchema(t, 12),
    bedroomFilterIndex: z.number().int().min(0, t('optionInvalid')).max(2, t('optionInvalid')),
    areaFilterIndex: z.number().int().min(0, t('optionInvalid')).max(2, t('optionInvalid')),
    customMinArea: createNumericTextSchema(t, 8),
    onlyWithParking: z.boolean(),
    sortOption: z.enum(['relevancia', 'menor-preco', 'maior-preco']),
    viewMode: z.enum(searchResultsViewModes),
    currentPage: z.number().int().min(1, t('optionInvalid')),
  })
}

export function createSearchResultsFiltersDialogFormSchema(t: SchemaMessageTranslator) {
  return z.object({
    isFiltersOpen: z.boolean(),
    propertyTypeFilter: z.string().trim().max(80, t('textTooLong')),
    priceFilterIndex: z.number().int().min(0, t('optionInvalid')).max(2, t('optionInvalid')),
    customMaxPrice: createNumericTextSchema(t, 12),
    bedroomFilterIndex: z.number().int().min(0, t('optionInvalid')).max(2, t('optionInvalid')),
    areaFilterIndex: z.number().int().min(0, t('optionInvalid')).max(2, t('optionInvalid')),
    customMinArea: createNumericTextSchema(t, 8),
    onlyWithParking: z.boolean(),
  })
}

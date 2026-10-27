import { z } from 'zod'

import { marketplacePropertyTypes } from '../config/property-types'
import type { SchemaMessageTranslator } from '@shared/types'

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

export function createSearchResultsFiltersFormSchema(t: SchemaMessageTranslator) {
  return z.object({
    propertyType: z.enum(marketplacePropertyTypes).nullable(),
    priceOption: z.number().int().min(0, t('optionInvalid')).max(2, t('optionInvalid')),
    customMaxPrice: createNumericTextSchema(t, 12),
    bedroomOption: z.number().int().min(0, t('optionInvalid')).max(2, t('optionInvalid')),
    areaOption: z.number().int().min(0, t('optionInvalid')).max(2, t('optionInvalid')),
    customMinArea: createNumericTextSchema(t, 8),
    onlyWithParking: z.boolean(),
  })
}

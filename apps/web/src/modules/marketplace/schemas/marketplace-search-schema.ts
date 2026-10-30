import { z } from 'zod'

import { marketplacePropertyTypes } from '../config/property-types'
import type { SchemaMessageTranslator } from '@shared/types'

const searchFilterKeySchema = z.enum(['location', 'propertyType', 'priceRange'])

const createTextSearchDraftSchema = (t: SchemaMessageTranslator<'textTooLong'>) =>
  z.object({
    location: z.string().trim().max(80, t('textTooLong')),
    propertyType: z.string().trim().max(80, t('textTooLong')),
  })

const createNumericTextSchema = (
  t: SchemaMessageTranslator<'numberTooLong' | 'numbersOnly'>,
  maxLength: number,
  decimal = false,
) =>
  z
    .string()
    .trim()
    .max(maxLength, t('numberTooLong'))
    .regex(decimal ? /^(?:\d+(?:\.\d{0,2})?)?$/ : /^\d*$/, t('numbersOnly'))

export function createMarketplaceSearchFormSchema(
  t: SchemaMessageTranslator<'optionRequired' | 'priceInvalid' | 'textTooLong'>,
) {
  return z.object({
    activeSearchMenu: searchFilterKeySchema.nullable(),
    selectedSearch: z.object({
      location: z.string().trim().min(1, t('optionRequired')).max(80, t('textTooLong')),
      propertyType: z.string().trim().min(1, t('optionRequired')).max(80, t('textTooLong')),
      priceRange: z.string().trim().min(1, t('optionRequired')).max(80, t('textTooLong')),
    }),
    priceRange: z.tuple([
      z.number().min(0, t('priceInvalid')).nullable(),
      z.number().min(0, t('priceInvalid')).nullable(),
    ]),
    searchDraft: createTextSearchDraftSchema(t),
  })
}

export function createSearchResultsFiltersFormSchema(
  t: SchemaMessageTranslator<'numberTooLong' | 'numbersOnly' | 'optionInvalid'>,
) {
  return z.object({
    propertyType: z.enum(marketplacePropertyTypes).nullable(),
    priceOption: z.number().int().min(0, t('optionInvalid')).max(2, t('optionInvalid')),
    customMaxPrice: createNumericTextSchema(t, 15, true),
    bedroomOption: z.number().int().min(0, t('optionInvalid')).max(2, t('optionInvalid')),
    areaOption: z.number().int().min(0, t('optionInvalid')).max(2, t('optionInvalid')),
    customMinArea: createNumericTextSchema(t, 8),
    onlyWithParking: z.boolean(),
  })
}

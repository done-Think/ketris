import { z } from 'zod'

import {
  createPropertyTypeOptions,
  createPropertyFeatureOptions,
  createPropertyPublishingOptions,
} from '../config/dashboard-property-ui'

import type {
  CreateDashboardPropertyFormValues,
  CreatePropertyPurpose,
} from '../types/dashboard-property'
import type { SchemaMessageTranslator } from '@shared/types'
import { normalizePostalCode } from '@shared/utils/postal-code'

export function createDashboardPropertySchema(
  t: SchemaMessageTranslator<
    | 'areaRequired'
    | 'cityRequired'
    | 'descriptionRequired'
    | 'descriptionTooLong'
    | 'integerRequired'
    | 'mainValueRequired'
    | 'negotiationTermRequired'
    | 'negotiationTermTooLong'
    | 'neighborhoodRequired'
    | 'numberInvalid'
    | 'numberRequired'
    | 'propertyTypeRequired'
    | 'purposeRequired'
    | 'rentalValueInvalid'
    | 'rentalValueRequired'
    | 'stateRequired'
    | 'streetRequired'
    | 'titleRequired'
    | 'titleTooLong'
    | 'zipCodeRequired'
    | 'zipCodeInvalid'
  >,
) {
  const numberField = z.coerce.number().nonnegative(t('numberInvalid'))
  const countField = numberField.int(t('integerRequired'))

  return z
    .object({
      type: z.enum(createPropertyTypeOptions, {
        errorMap: () => ({ message: t('propertyTypeRequired') }),
      }),
      purpose: z
        .array(z.enum(['RENT', 'SALE'] satisfies [CreatePropertyPurpose, CreatePropertyPurpose]))
        .min(1, t('purposeRequired')),
      ownerUserId: z.string().default(''),
      ownerContact: z
        .object({ id: z.string().min(1), name: z.string().min(1) })
        .nullable()
        .default(null),
      complement: z.string().default(''),
      title: z.string().min(3, t('titleRequired')).max(200, t('titleTooLong')),
      description: z.string().min(10, t('descriptionRequired')).max(10000, t('descriptionTooLong')),
      street: z.string().min(3, t('streetRequired')),
      number: z.string().min(1, t('numberRequired')),
      neighborhood: z.string().min(2, t('neighborhoodRequired')),
      city: z.string().min(2, t('cityRequired')),
      state: z.string().length(2, t('stateRequired')),
      zipCode: z
        .string()
        .trim()
        .min(1, t('zipCodeRequired'))
        .refine((value) => normalizePostalCode(value) !== null, t('zipCodeInvalid'))
        .transform((value) => normalizePostalCode(value)!),
      bedrooms: countField,
      bathrooms: countField,
      parkingSpaces: countField,
      area: z.coerce.number().positive(t('areaRequired')),
      features: z.array(z.enum(createPropertyFeatureOptions)).default([]),
      media: z
        .array(
          z.object({
            url: z.string(),
            type: z.enum(['photo', 'floorPlan', 'video']).optional(),
            order: z.number().optional(),
          }),
        )
        .default([]),
      mainValue: z.coerce.number().positive(t('mainValueRequired')),
      rentalValue: z.coerce.number().nonnegative(t('rentalValueInvalid')).optional(),
      condominium: numberField,
      propertyTax: numberField,
      negotiationTerm: z
        .string()
        .min(1, t('negotiationTermRequired'))
        .max(2000, t('negotiationTermTooLong')),
      publishingOptions: z.array(z.enum(createPropertyPublishingOptions)).default([]),
    })
    .superRefine((values, context) => {
      if (
        values.purpose.includes('RENT') &&
        values.purpose.includes('SALE') &&
        (!values.rentalValue || values.rentalValue <= 0)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rentalValue'],
          message: t('rentalValueRequired'),
        })
      }
    })
}

export const createDashboardPropertyDefaultValues: CreateDashboardPropertyFormValues = {
  type: 'apartment',
  purpose: ['RENT'],
  ownerUserId: '',
  ownerContact: null,
  complement: '',
  title: '',
  description: '',
  street: '',
  number: '',
  neighborhood: '',
  city: '',
  state: '',
  zipCode: '',
  bedrooms: 0,
  bathrooms: 0,
  parkingSpaces: 0,
  area: 0,
  features: [],
  media: [],
  mainValue: 0,
  rentalValue: 0,
  condominium: 0,
  propertyTax: 0,
  negotiationTerm: '',
  publishingOptions: [],
}

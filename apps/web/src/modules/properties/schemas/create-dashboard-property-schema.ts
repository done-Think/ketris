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

export function createDashboardPropertySchema(t: SchemaMessageTranslator) {
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
      complement: z.string().default(''),
      latitude: z
        .preprocess(
          (value) => (value === '' ? null : value),
          z.coerce
            .number({ invalid_type_error: t('latitudeInvalid') })
            .min(-90, t('latitudeInvalid'))
            .max(90, t('latitudeInvalid'))
            .nullable(),
        )
        .default(null),
      longitude: z
        .preprocess(
          (value) => (value === '' ? null : value),
          z.coerce
            .number({ invalid_type_error: t('longitudeInvalid') })
            .min(-180, t('longitudeInvalid'))
            .max(180, t('longitudeInvalid'))
            .nullable(),
        )
        .default(null),
      title: z.string().min(3, t('titleRequired')).max(200, t('titleTooLong')),
      description: z.string().min(10, t('descriptionRequired')).max(10000, t('descriptionTooLong')),
      street: z.string().min(3, t('streetRequired')),
      number: z.string().min(1, t('numberRequired')),
      neighborhood: z.string().min(2, t('neighborhoodRequired')),
      city: z.string().min(2, t('cityRequired')),
      state: z.string().length(2, t('stateRequired')),
      zipCode: z.string().min(8, t('zipCodeRequired')),
      bedrooms: countField,
      bathrooms: countField,
      parkingSpaces: countField,
      area: z.coerce.number().positive(t('areaRequired')),
      features: z.array(z.enum(createPropertyFeatureOptions)).default([]),
      media: z
        .array(
          z.object({ url: z.string(), type: z.string().optional(), order: z.number().optional() }),
        )
        .default([]),
      mainValue: z.coerce.number().positive(t('mainValueRequired')),
      rentalValue: z.coerce.number().nonnegative(t('rentalValueInvalid')).optional(),
      condominium: numberField,
      iptu: numberField,
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
  complement: '',
  latitude: null,
  longitude: null,
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
  iptu: 0,
  negotiationTerm: '',
  publishingOptions: [],
}

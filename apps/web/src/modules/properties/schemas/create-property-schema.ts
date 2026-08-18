import { z } from 'zod'

import {
  createPropertyFeatureOptions,
  createPropertyPublishingOptions,
  createPropertyPurposeOptions,
  createPropertyTypeOptions,
} from '../config/dashboard-property-ui'

const requiredNumber = (message: string) =>
  z.coerce.number({ invalid_type_error: message }).nonnegative(message)

export const createPropertySchema = z
  .object({
    type: z.enum(createPropertyTypeOptions),
    purpose: z.enum(createPropertyPurposeOptions),
    title: z.string().trim().min(3, 'Informe o título do anúncio'),
    description: z.string().trim().min(20, 'Descreva o imóvel em pelo menos 20 caracteres'),
    street: z.string().trim().min(3, 'Informe o endereço'),
    number: z.string().trim().min(1, 'Informe o número'),
    neighborhood: z.string().trim().min(2, 'Informe o bairro'),
    city: z.string().trim().min(2, 'Informe a cidade'),
    state: z.string().trim().length(2, 'Informe a UF'),
    zipCode: z
      .string()
      .trim()
      .refine((value) => value.replace(/\D/g, '').length === 8, 'Informe um CEP válido'),
    bedrooms: requiredNumber('Informe o número de quartos'),
    bathrooms: requiredNumber('Informe o número de banheiros'),
    parkingSpaces: requiredNumber('Informe o número de vagas'),
    area: z.coerce
      .number({ invalid_type_error: 'Informe a área útil' })
      .positive('Informe a área útil'),
    features: z.array(z.enum(createPropertyFeatureOptions)),
    rentPrice: z.coerce.number().nonnegative().optional(),
    salePrice: z.coerce.number().nonnegative().optional(),
    condominium: z.coerce.number().nonnegative().optional(),
    iptu: z.coerce.number().nonnegative().optional(),
    warranty: z.string().trim().optional(),
    publishing: z.array(z.enum(createPropertyPublishingOptions)),
  })
  .superRefine((values, context) => {
    if (values.purpose === 'Aluguel' && !values.rentPrice) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe o valor do aluguel',
        path: ['rentPrice'],
      })
    }

    if (values.purpose === 'Venda' && !values.salePrice) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe o valor de venda',
        path: ['salePrice'],
      })
    }
  })

export type CreatePropertyFormValues = z.infer<typeof createPropertySchema>

export const createPropertyStepFields = {
  basic: ['type', 'purpose', 'title', 'description'],
  address: ['street', 'number', 'neighborhood', 'city', 'state', 'zipCode'],
  features: ['bedrooms', 'bathrooms', 'parkingSpaces', 'area', 'features'],
  media: [],
  values: ['rentPrice', 'salePrice', 'condominium', 'iptu', 'warranty'],
  publishing: ['publishing'],
} as const satisfies Record<string, ReadonlyArray<keyof CreatePropertyFormValues>>

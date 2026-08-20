import { z } from 'zod'

export const propertyTypeEnum = z.enum([
  'apartment',
  'house',
  'commercial',
  'land',
  'studio',
  'farm',
])

export const propertyStatusEnum = z.enum(['draft', 'published', 'rented', 'sold', 'inactive'])

export const propertyAddressSchema = z.object({
  street: z.string().min(3, 'Informe o logradouro'),
  number: z.string().min(1, 'Informe o número'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Informe o bairro'),
  city: z.string().min(2, 'Informe a cidade'),
  state: z.string().length(2, 'Informe a UF'),
  zipCode: z.string().min(8, 'Informe o CEP'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

export const propertyMediaSchema = z.object({
  id: z.string().optional(),
  url: z.string().url('Informe uma URL válida'),
  alt: z.string().optional(),
  order: z.number().int().nonnegative().default(0),
  isCover: z.boolean().default(false),
})

export const propertyValuesSchema = z.object({
  rent: z.number().nonnegative().optional(),
  sale: z.number().nonnegative().optional(),
  condominium: z.number().nonnegative().optional(),
  iptu: z.number().nonnegative().optional(),
})

export const propertySchema = z.object({
  title: z.string().min(3, 'Informe um título'),
  type: propertyTypeEnum,
  status: propertyStatusEnum.default('draft'),
  price: z.number().positive('Preço deve ser maior que zero'),
  values: propertyValuesSchema.optional(),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  parkingSpaces: z.number().int().nonnegative().optional(),
  area: z.number().positive().optional(),
  city: z.string().min(2, 'Informe a cidade').optional(),
  address: z.union([z.string().min(3, 'Informe o endereço'), propertyAddressSchema]),
  media: z.array(propertyMediaSchema).default([]),
  features: z.array(z.string()).default([]),
  responsibleUserId: z.string().optional(),
})

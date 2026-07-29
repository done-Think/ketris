import { z } from 'zod'

export const propertyTypeEnum = z.enum(['apartment', 'house', 'commercial', 'land'])

export const propertySchema = z.object({
  title: z.string().min(3, 'Informe um título'),
  type: propertyTypeEnum,
  price: z.number().positive('Preço deve ser maior que zero'),
  bedrooms: z.number().int().nonnegative().optional(),
  city: z.string().min(2, 'Informe a cidade'),
  address: z.string().min(3, 'Informe o endereço'),
})

export type PropertyFormValues = z.infer<typeof propertySchema>

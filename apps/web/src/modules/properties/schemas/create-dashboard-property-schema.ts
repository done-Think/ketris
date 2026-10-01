import { z } from 'zod'

import type {
  CreateDashboardPropertyFormValues,
  CreatePropertyPurpose,
} from '../types/dashboard-property'

export type SchemaMessageTranslator = (key: string) => string

export function createDashboardPropertySchema(t: SchemaMessageTranslator) {
  const numberField = z.coerce.number().nonnegative(t('numberInvalid'))

  return z.object({
    activeStepIndex: z.number().int().min(0).default(0),
    maxVisitedStepIndex: z.number().int().min(0).default(0),
    type: z.string().min(1, t('propertyTypeRequired')),
    purpose: z
      .array(z.enum(['Aluguel', 'Venda'] satisfies [CreatePropertyPurpose, CreatePropertyPurpose]))
      .min(1, t('purposeRequired')),
    title: z.string().min(3, t('titleRequired')),
    description: z.string().min(10, t('descriptionRequired')),
    street: z.string().min(3, t('streetRequired')),
    number: z.string().min(1, t('numberRequired')),
    neighborhood: z.string().min(2, t('neighborhoodRequired')),
    city: z.string().min(2, t('cityRequired')),
    state: z.string().length(2, t('stateRequired')),
    zipCode: z.string().min(8, t('zipCodeRequired')),
    bedrooms: numberField,
    bathrooms: numberField,
    parkingSpaces: numberField,
    area: z.coerce.number().positive(t('areaRequired')),
    features: z.array(z.string()).default([]),
    media: z
      .array(
        z.object({ url: z.string(), type: z.string().optional(), order: z.number().optional() }),
      )
      .default([]),
    mainValue: z.coerce.number().positive(t('mainValueRequired')),
    condominium: numberField,
    iptu: numberField,
    negotiationTerm: z.string().min(1, t('negotiationTermRequired')),
    publishingOptions: z.array(z.string()).default([]),
  })
}

export const createDashboardPropertyDefaultValues: CreateDashboardPropertyFormValues = {
  activeStepIndex: 0,
  maxVisitedStepIndex: 0,
  type: 'Apartamento',
  purpose: ['Aluguel'],
  title: 'Apartamento moderno com vista incrível nos Jardins',
  description:
    'Excelente apartamento mobiliado, com 3 quartos, varanda gourmet espaçosa e 2 vagas de garagem demarcadas. Localização nobre, próximo a comércio especializado, restaurantes premiados e estação de metrô.',
  street: 'Alameda Lorena',
  number: '1420',
  neighborhood: 'Jardins',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01424-001',
  bedrooms: 3,
  bathrooms: 2,
  parkingSpaces: 2,
  area: 95,
  features: ['Mobiliado', 'Varanda gourmet', 'Portaria 24h'],
  media: [],
  mainValue: 6500,
  condominium: 1200,
  iptu: 380,
  negotiationTerm: '3 aluguéis',
  publishingOptions: ['Publicar no marketplace após revisão', 'Permitir contato por WhatsApp'],
}

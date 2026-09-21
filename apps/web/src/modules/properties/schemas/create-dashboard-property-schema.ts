import { z } from 'zod'

import type {
  CreateDashboardPropertyFormValues,
  CreatePropertyPurpose,
} from '../types/dashboard-property'

const numberField = z.coerce.number().nonnegative('Informe um valor válido')

export const createDashboardPropertySchema = z.object({
  activeStepIndex: z.number().int().min(0).default(0),
  maxVisitedStepIndex: z.number().int().min(0).default(0),
  type: z.string().min(1, 'Selecione o tipo de imóvel'),
  purpose: z
    .array(z.enum(['Aluguel', 'Venda'] satisfies [CreatePropertyPurpose, CreatePropertyPurpose]))
    .min(1, 'Selecione ao menos uma finalidade'),
  title: z.string().min(3, 'Informe o título do anúncio'),
  description: z.string().min(10, 'Informe uma descrição mais completa'),
  street: z.string().min(3, 'Informe o endereço'),
  number: z.string().min(1, 'Informe o número'),
  neighborhood: z.string().min(2, 'Informe o bairro'),
  city: z.string().min(2, 'Informe a cidade'),
  state: z.string().length(2, 'Informe a UF'),
  zipCode: z.string().min(8, 'Informe o CEP'),
  bedrooms: numberField,
  bathrooms: numberField,
  parkingSpaces: numberField,
  area: z.coerce.number().positive('Informe a área útil'),
  features: z.array(z.string()).default([]),
  mediaSlots: z.array(z.string()).default([]),
  mainValue: z.coerce.number().positive('Informe o valor principal'),
  condominium: numberField,
  iptu: numberField,
  negotiationTerm: z.string().min(1, 'Informe a condição comercial'),
  publishingOptions: z.array(z.string()).default([]),
})

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
  mediaSlots: ['Foto principal'],
  mainValue: 6500,
  condominium: 1200,
  iptu: 380,
  negotiationTerm: '3 aluguéis',
  publishingOptions: ['Publicar no marketplace após revisão', 'Permitir contato por WhatsApp'],
}

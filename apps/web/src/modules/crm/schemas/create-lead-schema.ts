import { z } from 'zod'

export type SchemaMessageTranslator = (key: string) => string

export function createLeadSchema(t: SchemaMessageTranslator) {
  return z.object({
    activeStepIndex: z.number().int().min(0).max(2),
    maxVisitedStepIndex: z.number().int().min(0).max(2),
    name: z.string().trim().min(2, t('nameRequired')),
    phone: z.string().trim().min(14, t('phoneInvalid')),
    email: z
      .string()
      .trim()
      .refine((value) => !value || z.string().email().safeParse(value).success, {
        message: t('emailInvalid'),
      }),
    interest: z.string().trim().min(3, t('interestRequired')),
    budget: z.string().trim().min(2, t('budgetRequired')),
    source: z.string().trim().min(2, t('sourceRequired')),
    broker: z.string().trim().min(2, t('brokerRequired')),
    stage: z.enum(['Novo', 'Em contato', 'Visita marcada', 'Proposta']),
    notes: z.string().trim(),
  })
}

export const createLeadDefaultValues = {
  activeStepIndex: 0,
  maxVisitedStepIndex: 0,
  name: '',
  phone: '',
  email: '',
  interest: '',
  budget: '',
  source: 'Marketplace',
  broker: 'Marina Costa',
  stage: 'Novo',
  notes: '',
} satisfies z.infer<ReturnType<typeof createLeadSchema>>

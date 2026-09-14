import { z } from 'zod'

export const createLeadSchema = z.object({
  activeStepIndex: z.number().int().min(0).max(2),
  maxVisitedStepIndex: z.number().int().min(0).max(2),
  name: z.string().trim().min(2, 'Informe o nome do lead'),
  phone: z.string().trim().min(14, 'Informe um telefone válido'),
  email: z
    .string()
    .trim()
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: 'Informe um e-mail válido',
    }),
  interest: z.string().trim().min(3, 'Informe o imóvel ou interesse'),
  budget: z.string().trim().min(2, 'Informe o orçamento'),
  source: z.string().trim().min(2, 'Informe a origem'),
  broker: z.string().trim().min(2, 'Informe o corretor responsável'),
  stage: z.enum(['Novo', 'Em contato', 'Visita marcada', 'Proposta']),
  notes: z.string().trim(),
})

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
} satisfies z.infer<typeof createLeadSchema>

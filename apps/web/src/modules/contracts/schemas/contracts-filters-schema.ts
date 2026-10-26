import { z } from 'zod'

export const contractsFiltersSchema = z.object({
  searchQuery: z.string().default(''),
  status: z
    .enum([
      'ALL',
      'RASCUNHO',
      'EM_REVISAO',
      'AGUARDANDO_ASSINATURA',
      'ASSINADO',
      'ATIVO',
      'ENCERRADO',
      'CANCELADO',
    ])
    .default('ALL'),
  type: z.enum(['ALL', 'RESIDENCIAL', 'COMERCIAL', 'TEMPORADA']).default('ALL'),
  period: z.enum(['ALL', 'THIS_MONTH', 'NEXT_90_DAYS']).default('ALL'),
})

export const contractsFiltersDefaultValues = {
  searchQuery: '',
  status: 'ALL',
  type: 'ALL',
  period: 'ALL',
} satisfies z.infer<typeof contractsFiltersSchema>

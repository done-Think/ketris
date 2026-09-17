import { z } from 'zod'

export const contractsFiltersSchema = z.object({
  searchQuery: z.string().default(''),
  status: z
    .enum([
      'Todos',
      'Rascunho',
      'Em revisão',
      'Aguardando assinatura',
      'Assinado',
      'Ativo',
      'Encerrado',
      'Cancelado',
    ])
    .default('Todos'),
  type: z.enum(['Todos', 'Residencial', 'Comercial', 'Temporada']).default('Todos'),
  period: z.enum(['Todos', 'Vencem este mês', 'Vencem em 90 dias']).default('Todos'),
})

export const contractsFiltersDefaultValues = {
  searchQuery: '',
  status: 'Todos',
  type: 'Todos',
  period: 'Todos',
} satisfies z.infer<typeof contractsFiltersSchema>

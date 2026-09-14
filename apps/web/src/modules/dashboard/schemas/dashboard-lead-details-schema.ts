import { z } from 'zod'

export const dashboardLeadDetailsSchema = z.object({
  reportedNeed: z.string().min(1, 'Informe o relato do cliente.'),
  lookingFor: z.string().min(1, 'Informe o que o cliente procura.'),
  budgetRange: z.string().min(1, 'Informe a base de valores.'),
  downPayment: z.string().min(1, 'Informe o valor de entrada.'),
  financingStatus: z.string().min(1, 'Informe a situação de financiamento.'),
  timeline: z.string().min(1, 'Informe o prazo de decisão.'),
  notes: z.string().min(1, 'Informe as observações para atendimento.'),
})

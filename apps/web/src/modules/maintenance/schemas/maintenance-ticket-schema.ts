import { z } from 'zod'

export const maintenanceTicketSchema = z.object({
  propertyId: z.string().min(1, 'Selecione o imóvel'),
  category: z.string().min(1, 'Selecione a categoria'),
  priority: z.enum(['normal', 'high', 'urgent'], { message: 'Selecione a prioridade' }),
  title: z.string().trim().min(1, 'Informe o título do chamado'),
  description: z.string().trim().min(1, 'Descreva o problema'),
})

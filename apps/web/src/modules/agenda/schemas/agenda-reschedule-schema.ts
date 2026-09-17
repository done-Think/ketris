import { z } from 'zod'

export const agendaRescheduleSchema = z.object({
  scheduledDate: z.string().min(1, 'Informe a data'),
  scheduledTime: z.string().min(1, 'Informe o horário'),
})

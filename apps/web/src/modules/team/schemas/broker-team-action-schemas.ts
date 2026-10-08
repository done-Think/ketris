import { z } from 'zod'

export const brokerGoalSchema = z.object({
  monthlyGoal: z.coerce.number().int().min(1).max(10000),
})

export const brokerTransferSchema = z
  .object({
    destinationId: z.string().min(1, 'Selecione o corretor de destino'),
    leads: z.boolean(),
    properties: z.boolean(),
  })
  .refine((values) => values.leads || values.properties, {
    path: ['leads'],
    message: 'Selecione ao menos um item',
  })

import { z } from 'zod'
import { chargeDateSchema } from './charge-date-schema'

export const createChargeSchema = z.object({
  description: z.string().trim().min(1, 'Description is required'),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  dueDate: chargeDateSchema,
  direction: z.enum(['receivable', 'payable']),
  status: z.enum(['pending', 'scheduled']),
})

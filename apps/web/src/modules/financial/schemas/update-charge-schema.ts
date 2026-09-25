import { z } from 'zod'
import { chargeDateSchema } from './charge-date-schema'

export const updateChargeSchema = z.object({
  tenant: z.string().trim().min(1, 'Tenant is required'),
  property: z.string().trim().min(1, 'Property is required'),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  dueDate: chargeDateSchema,
  direction: z.enum(['receivable', 'payable']),
  status: z.enum(['pending', 'overdue', 'paid', 'scheduled', 'cancelled']),
})

import { z } from 'zod'
import { chargeDateSchema } from './charge-date-schema'

export const registerPaymentSchema = z.object({
  paymentDate: chargeDateSchema,
  paymentMethod: z.string().trim().min(1, 'Payment method is required'),
})

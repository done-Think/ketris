import { z } from 'zod'
export const contactSelectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
})

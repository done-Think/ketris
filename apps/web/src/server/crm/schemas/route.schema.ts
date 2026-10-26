import { z } from 'zod'
export const crmIdParamsSchema = z.object({ id: z.string().trim().min(1).max(200) }).strict()

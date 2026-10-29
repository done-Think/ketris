import '@server/openapi/zod-extend'
import { z } from 'zod'

export const userIdParamsSchema = z.object({
  id: z
    .string()
    .min(1)
    .openapi({ description: 'ID do usuário.', example: 'clx1y2z3a0000abcd1234efgh' }),
})

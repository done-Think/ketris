import '@server/openapi/zod-extend'
import { z } from 'zod'

export const platformIdParamsSchema = z.object({ id: z.string().trim().min(1).max(64) }).strict()

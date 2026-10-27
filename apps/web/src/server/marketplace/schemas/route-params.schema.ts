import '@server/openapi/zod-extend'
import { z } from 'zod'

export const marketplaceIdParamsSchema = z.object({ id: z.string().trim().min(1).max(64) }).strict()

export const marketplaceMediaParamsSchema = z.object({ key: z.array(z.string()) }).strict()

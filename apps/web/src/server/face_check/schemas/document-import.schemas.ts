import { z } from 'zod'

import { tokenParamsSchema } from './api.schemas'

const documentRegionSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().positive().max(1),
    height: z.number().positive().max(1),
  })
  .refine((region) => region.x + region.width <= 1.001 && region.y + region.height <= 1.001)

export const documentRegionsResultSchema = z.object({
  regions: z.array(documentRegionSchema).max(8),
})

export const documentAssetParamsSchema = tokenParamsSchema.extend({
  kind: z.enum(['cmaps', 'standard_fonts', 'wasm']),
  name: z
    .string()
    .max(100)
    .regex(/^[a-zA-Z0-9_-]+\.(?:bcmap|ttf|pfb|wasm|js)$/),
})

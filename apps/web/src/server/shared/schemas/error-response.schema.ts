import '@server/openapi/zod-extend'
import { z } from 'zod'

export const errorResponseSchema = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      issues: z
        .array(
          z.object({
            path: z.string(),
            message: z.string(),
            code: z.string().optional(),
            params: z.record(z.unknown()).optional(),
          }),
        )
        .optional(),
    }),
  })
  .openapi('ErrorResponse')

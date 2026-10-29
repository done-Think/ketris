import { validationRefinement } from '@server/shared/http/validation-messages'
import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedPlatformAdminSchema } from './platform-admin.schema'

export const updatePlatformAdminRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    email: z.string().trim().max(254).email().optional(),
    role: z.enum(['ADMIN', 'ADMIN_AGENT', 'AGENT']).optional(),
    active: z.literal(true).optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.name !== undefined ||
      data.email !== undefined ||
      data.role !== undefined ||
      data.active !== undefined,
    {
      ...validationRefinement('updateRequired'),
    },
  )
  .openapi('UpdatePlatformAdminRequest')

export const updatePlatformAdminResponseSchema = z
  .object({
    admin: authenticatedPlatformAdminSchema,
  })
  .openapi('UpdatePlatformAdminResponse')

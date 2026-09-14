import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedPlatformAdminSchema } from './platform-admin.schema'

export const listPlatformAdminsResponseSchema = z
  .object({
    admins: z.array(authenticatedPlatformAdminSchema),
  })
  .openapi('ListPlatformAdminsResponse')

export const getPlatformAdminResponseSchema = z
  .object({
    admin: authenticatedPlatformAdminSchema,
  })
  .openapi('GetPlatformAdminResponse')

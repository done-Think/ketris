import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedUserSchema } from './user.schema'

export const listAdminsResponseSchema = z
  .object({
    admins: z.array(authenticatedUserSchema),
  })
  .openapi('ListAdminsResponse')

export const getAdminResponseSchema = z
  .object({
    admin: authenticatedUserSchema,
  })
  .openapi('GetAdminResponse')

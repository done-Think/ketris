import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedUserResponseSchema } from './user.schema'

export const listAdminsResponseSchema = z
  .object({
    admins: z.array(authenticatedUserResponseSchema),
  })
  .openapi('ListAdminsResponse')

export const getAdminResponseSchema = z
  .object({
    admin: authenticatedUserResponseSchema,
  })
  .openapi('GetAdminResponse')

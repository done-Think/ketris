import '@server/openapi/zod-extend'
import { authenticatedUserSchema } from '@server/auth/schemas/user.schema'
import { z } from 'zod'

export const listTenantUsersResponseSchema = z
  .object({
    users: z.array(authenticatedUserSchema),
  })
  .openapi('ListTenantUsersResponse')

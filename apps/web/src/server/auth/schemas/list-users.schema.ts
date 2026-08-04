import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedUserSchema } from './user.schema'

export const listUsersResponseSchema = z
  .object({
    users: z.array(authenticatedUserSchema),
  })
  .openapi('ListUsersResponse')

export const getUserResponseSchema = z
  .object({
    user: authenticatedUserSchema,
  })
  .openapi('GetUserResponse')

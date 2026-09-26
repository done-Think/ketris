import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedUserResponseSchema } from './user.schema'

export const listUsersResponseSchema = z
  .object({
    users: z.array(authenticatedUserResponseSchema),
  })
  .openapi('ListUsersResponse')

export const getUserResponseSchema = z
  .object({
    user: authenticatedUserResponseSchema,
  })
  .openapi('GetUserResponse')

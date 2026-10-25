import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedUserResponseSchema } from './user.schema'

export const listUsersQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(1000000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
    pendingApproval: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
  })
  .strict()
  .openapi('ListUsersQuery')

export const listUsersResponseSchema = z
  .object({
    users: z.array(authenticatedUserResponseSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  })
  .openapi('ListUsersResponse')

export const getUserResponseSchema = z
  .object({
    user: authenticatedUserResponseSchema,
  })
  .openapi('GetUserResponse')

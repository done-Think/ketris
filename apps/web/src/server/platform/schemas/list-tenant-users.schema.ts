import '@server/openapi/zod-extend'
import { authenticatedUserResponseSchema } from '@server/auth/schemas/user.schema'
import { z } from 'zod'

import { platformPageFields, platformPageQueryFields } from './list-tenants.schema'

export const listTenantUsersQuerySchema = z
  .object({ ...platformPageQueryFields })
  .strict()
  .openapi('ListTenantUsersQuery')

export const listTenantUsersResponseSchema = z
  .object({
    users: z.array(authenticatedUserResponseSchema),
    ...platformPageFields,
  })
  .openapi('ListTenantUsersResponse')

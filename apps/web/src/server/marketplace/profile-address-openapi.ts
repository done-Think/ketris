import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'
import {
  ownProfileAddressSchema,
  profileAddressAvailabilityQuerySchema,
  profileAddressAvailabilitySchema,
  profileAddressParamsSchema,
  saveProfileAddressSchema,
} from './schemas/profile-address.schema'

export function registerProfileAddressOpenApi(registry: OpenAPIRegistry) {
  const errors = Object.fromEntries(
    [400, 401, 403].map((status) => [
      status,
      {
        description:
          status === 400
            ? 'Invalid kind or handle.'
            : status === 401
              ? 'Authentication required.'
              : 'The actor cannot edit this profile kind.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    ]),
  )
  const common = { tags: ['Marketplace'], security: [{ bearerAuth: [] }] }
  registry.registerPath({
    ...common,
    method: 'get',
    path: '/marketplace/profiles/{kind}/address',
    summary: 'Get the current actor’s public profile address.',
    request: { params: profileAddressParamsSchema },
    responses: {
      ...errors,
      200: {
        description: 'Own public profile address.',
        content: { 'application/json': { schema: ownProfileAddressSchema } },
      },
    },
  })
  registry.registerPath({
    ...common,
    method: 'put',
    path: '/marketplace/profiles/{kind}/address',
    summary:
      'Claim or replace the current actor’s address. Previous handles are released immediately; no aliases are retained.',
    request: {
      params: profileAddressParamsSchema,
      body: {
        required: true,
        content: { 'application/json': { schema: saveProfileAddressSchema } },
      },
    },
    responses: {
      ...errors,
      409: {
        description: 'The handle is already assigned. The previous address remains unchanged.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      200: {
        description: 'Saved public profile address.',
        content: { 'application/json': { schema: ownProfileAddressSchema } },
      },
    },
  })
  registry.registerPath({
    ...common,
    method: 'get',
    path: '/marketplace/profiles/{kind}/address/availability',
    summary: 'Check availability in the shared broker and agency namespace.',
    request: { params: profileAddressParamsSchema, query: profileAddressAvailabilityQuerySchema },
    responses: {
      ...errors,
      200: {
        description: 'Availability is advisory; saving also enforces uniqueness.',
        content: { 'application/json': { schema: profileAddressAvailabilitySchema } },
      },
    },
  })
}

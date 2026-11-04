import '@server/openapi/zod-extend'
import { z } from 'zod'
import {
  publicProfileHandlePattern,
  isReservedPublicProfileHandle,
} from '@shared/utils/public-profile-handle'
import { validationRefinement } from '@server/shared/http/validation-messages'

export const publicProfileHandleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(40)
  .regex(publicProfileHandlePattern)
export const profileAddressParamsSchema = z
  .object({ kind: z.enum(['broker', 'agency']) })
  .openapi('ProfileAddressParams')
export const saveProfileAddressSchema = z
  .object({
    handle: publicProfileHandleSchema.refine(
      (value) => !isReservedPublicProfileHandle(value),
      validationRefinement('publicAddressReserved'),
    ),
  })
  .strict()
  .openapi('SavePublicProfileAddress')
export const profileAddressAvailabilityQuerySchema = z
  .object({ handle: publicProfileHandleSchema })
  .strict()
  .openapi('PublicProfileAddressAvailabilityQuery')
export const ownProfileAddressSchema = z
  .object({
    kind: z.enum(['broker', 'agency']),
    profileId: z.string(),
    handle: z.string().nullable(),
  })
  .openapi('OwnPublicProfileAddress')
export const profileAddressAvailabilitySchema = z
  .object({ available: z.boolean() })
  .openapi('PublicProfileAddressAvailability')

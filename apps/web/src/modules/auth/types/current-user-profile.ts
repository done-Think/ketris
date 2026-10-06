import type { z } from 'zod'

import type {
  createChangeOwnPasswordSchema,
  createCurrentUserProfileSchema,
} from '../schemas/current-user-profile-schema'

export type CurrentUserProfileValues = z.infer<ReturnType<typeof createCurrentUserProfileSchema>>
export type ChangeOwnPasswordValues = z.infer<ReturnType<typeof createChangeOwnPasswordSchema>>

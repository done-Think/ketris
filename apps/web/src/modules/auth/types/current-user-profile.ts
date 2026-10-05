import type { z } from 'zod'

import type {
  changeOwnPasswordSchema,
  currentUserProfileSchema,
} from '../schemas/current-user-profile-schema'

export type CurrentUserProfileValues = z.infer<typeof currentUserProfileSchema>
export type ChangeOwnPasswordValues = z.infer<typeof changeOwnPasswordSchema>

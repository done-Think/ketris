import { z } from 'zod'

import { REGISTRATION_PROFILE_IDS } from '../config/registration-profiles'

export const registrationProfileSchema = z.object({
  profile: z.enum(REGISTRATION_PROFILE_IDS),
})

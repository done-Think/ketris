import type { z } from 'zod'

import type { createVerificationCodeSchema } from '../schemas/password-recovery-schema'
import type { PublicConfirmEmailChangeDTO } from '@shared/types/generated/auth/http'

export type PublicEmailChangeValues = z.infer<ReturnType<typeof createVerificationCodeSchema>>
export type PublicEmailChangePayload = PublicConfirmEmailChangeDTO

export interface PublicEmailChangeScreenProps {
  requestId: string | null
}

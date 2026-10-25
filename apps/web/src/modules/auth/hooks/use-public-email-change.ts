import { useMutation } from '@tanstack/react-query'

import { emailChangeService } from '../services/email-change-service'
import type { PublicEmailChangePayload } from '../types/public-email-change'

export function usePublicEmailChange() {
  return useMutation({
    mutationFn: (payload: PublicEmailChangePayload) => emailChangeService.confirmPublic(payload),
  })
}

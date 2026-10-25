import { useMutation } from '@tanstack/react-query'

import { userService } from '../services/user-service'
import type {
  EmailChangeConfirmPayload,
  EmailChangeRequestPayload,
} from '../types/current-user-profile'

export function useRequestEmailChange() {
  return useMutation({
    mutationFn: ({ email, locale }: EmailChangeRequestPayload) =>
      userService.requestEmailChange(email, locale),
  })
}

export function useConfirmEmailChange() {
  return useMutation({
    mutationFn: ({ email, code }: EmailChangeConfirmPayload) =>
      userService.confirmEmailChange(email, code),
  })
}

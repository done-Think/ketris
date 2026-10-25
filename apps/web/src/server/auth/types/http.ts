import type { z } from 'zod'

import type { changeOwnPasswordRequestSchema } from '../schemas/change-own-password.schema'
import type { createUserRequestSchema } from '../schemas/create-user.schema'
import type {
  confirmEmailChangeSchema,
  confirmSignupVerificationResponseSchema,
  confirmSignupVerificationSchema,
  requestEmailChangeSchema,
  requestSignupVerificationSchema,
  publicConfirmEmailChangeSchema,
} from '../schemas/email-verification.schema'
import type { loginRequestSchema, loginResponseSchema } from '../schemas/login.schema'
import type { logoutRequestSchema } from '../schemas/logout.schema'
import type {
  requestPasswordResetCodeSchema,
  verifyPasswordResetCodeSchema,
  verifyPasswordResetCodeResponseSchema,
} from '../schemas/password-reset-code.schema'
import type { refreshTokenRequestSchema } from '../schemas/refresh-token.schema'
import type { resetPasswordRequestSchema } from '../schemas/reset-password.schema'
import type { updateUserRequestSchema } from '../schemas/update-user.schema'

export type ChangeOwnPasswordRequestDTO = z.infer<typeof changeOwnPasswordRequestSchema>
export type CreateUserRequestDTO = z.infer<typeof createUserRequestSchema>
export type LoginRequestDTO = z.infer<typeof loginRequestSchema>
export type LoginRequestInput = z.input<typeof loginRequestSchema>
export type LoginResponseDTO = z.infer<typeof loginResponseSchema>
export type LogoutRequestDTO = z.infer<typeof logoutRequestSchema>
export type RequestPasswordResetCodeDTO = z.infer<typeof requestPasswordResetCodeSchema>
export type VerifyPasswordResetCodeDTO = z.infer<typeof verifyPasswordResetCodeSchema>
export type VerifyPasswordResetCodeResponseDTO = z.infer<
  typeof verifyPasswordResetCodeResponseSchema
>
export type RefreshTokenRequestDTO = z.infer<typeof refreshTokenRequestSchema>
export type ResetPasswordRequestDTO = z.infer<typeof resetPasswordRequestSchema>
export type UpdateUserRequestDTO = z.infer<typeof updateUserRequestSchema>
export type RequestSignupVerificationDTO = z.infer<typeof requestSignupVerificationSchema>
export type ConfirmSignupVerificationDTO = z.infer<typeof confirmSignupVerificationSchema>
export type ConfirmSignupVerificationResponseDTO = z.infer<
  typeof confirmSignupVerificationResponseSchema
>
export type RequestEmailChangeDTO = z.infer<typeof requestEmailChangeSchema>
export type ConfirmEmailChangeDTO = z.infer<typeof confirmEmailChangeSchema>

export type PublicConfirmEmailChangeDTO = z.infer<typeof publicConfirmEmailChangeSchema>

export type AuthenticatedUserResponseDTO = z.infer<
  typeof import('../schemas/user.schema').authenticatedUserResponseSchema
>
export type CreateUserRequestInput = z.input<typeof createUserRequestSchema>
export type CreateUserResponseDTO = z.infer<
  typeof import('../schemas/create-user.schema').createUserResponseSchema
>
export type ListUsersResponseDTO = z.infer<
  typeof import('../schemas/list-users.schema').listUsersResponseSchema
>
export type GetUserResponseDTO = z.infer<
  typeof import('../schemas/list-users.schema').getUserResponseSchema
>
export type UpdateUserResponseDTO = z.infer<
  typeof import('../schemas/update-user.schema').updateUserResponseSchema
>
export type UploadAvatarResponseDTO = z.infer<
  typeof import('../schemas/avatar.schema').avatarUploadResponseSchema
>

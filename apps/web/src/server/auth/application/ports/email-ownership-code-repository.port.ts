import type { NewEmailOwnershipCode, VerifyEmailOwnershipCode } from '../../types/password-reset'

export interface EmailOwnershipCodeRepository {
  replace(input: NewEmailOwnershipCode): Promise<boolean>
  verify(input: VerifyEmailOwnershipCode): Promise<boolean>
}

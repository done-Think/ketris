import { AppError } from '@server/shared/errors'

export class PublicProfileAddressTakenError extends AppError {
  constructor() {
    super('Public profile address is already in use.', {
      status: 409,
      code: 'PUBLIC_PROFILE_ADDRESS_TAKEN',
    })
  }
}

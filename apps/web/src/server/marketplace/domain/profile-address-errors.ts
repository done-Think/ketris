import { AppError } from '@server/shared/errors'

export class PublicProfileNotPublishedError extends AppError {
  constructor() {
    super('Publish the profile before editing its public address.', {
      status: 409,
      code: 'PUBLIC_PROFILE_NOT_PUBLISHED',
    })
  }
}

export class PublicProfileAddressTakenError extends AppError {
  constructor() {
    super('Public profile address is already in use.', {
      status: 409,
      code: 'PUBLIC_PROFILE_ADDRESS_TAKEN',
    })
  }
}

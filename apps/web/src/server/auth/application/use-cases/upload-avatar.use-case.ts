import {
  AccountDeactivatedError,
  AvatarValidationError,
  UserNotFoundError,
} from '../../domain/errors'
import type { UploadAvatarInput } from '../../types/avatar'
import type { UserRepository } from '../ports/user-repository.port'
import type { AvatarStorage } from '../ports/avatar-storage.port'

export class UploadAvatarUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly storage: AvatarStorage,
  ) {}

  async execute(input: UploadAvatarInput) {
    const user = await this.users.findById(input.actorId)
    if (!user || user.tenantId !== input.actorTenantId) throw new UserNotFoundError()
    if (!user.active) throw new AccountDeactivatedError()
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(input.contentType) ||
      input.body.byteLength === 0 ||
      input.body.byteLength > 8 * 1024 * 1024
    ) {
      throw new AvatarValidationError()
    }
    return this.storage.upload({
      tenantId: user.tenantId,
      userId: user.id,
      filename: input.filename,
      contentType: input.contentType,
      body: input.body,
    })
  }
}

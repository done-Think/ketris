import { ProfileMediaNotFoundError } from '../../domain/errors'
import { toPublicProfileMediaKey } from '../../domain/profile-media-key'
import type { StoredProfileMedia } from '../../types/profile-media'
import type { ProfileMediaStoragePort } from '../ports/profile-media-storage.port'

export class GetProfileMediaUseCase {
  constructor(private readonly storage: ProfileMediaStoragePort) {}

  async execute(segments: readonly string[]): Promise<StoredProfileMedia> {
    const key = toPublicProfileMediaKey(segments)
    const media = key ? await this.storage.read(key) : null
    if (!media) throw new ProfileMediaNotFoundError()

    return media
  }
}

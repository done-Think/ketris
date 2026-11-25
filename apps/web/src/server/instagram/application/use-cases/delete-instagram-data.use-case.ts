import type { InstagramRepository } from '../ports/instagram-repository.port'
import type { InstagramMedia } from '../ports/instagram-api.port'

export class DeleteInstagramDataUseCase {
  constructor(
    private readonly repository: InstagramRepository,
    private readonly media: InstagramMedia,
  ) {}

  async execute(oauthUserId: string) {
    const keys = await this.repository.deletionMediaKeys(oauthUserId)
    await this.media.remove(keys)
    await this.repository.deleteByOAuthUser(oauthUserId)
  }
}

import { instagramTokenContext } from '../../domain/token-context'
import { assertInstagramActor } from '../../domain/access'
import { InstagramError } from '../../domain/errors'
import type { InstagramActor } from '../../types/instagram'
import type { InstagramRepository } from '../ports/instagram-repository.port'
import type { InstagramApi, InstagramTokenVault } from '../ports/instagram-api.port'

export class ConnectInstagramUseCase {
  constructor(
    private readonly repository: InstagramRepository,
    private readonly api: InstagramApi,
    private readonly vault: InstagramTokenVault,
  ) {}

  async start(actor: InstagramActor) {
    assertInstagramActor(actor)
    const state = this.vault.random()
    const verifier = this.vault.random()
    const authorizationUrl = this.api.authorizeUrl(state)
    await this.repository.saveState({
      hash: this.vault.digest(state),
      verifierHash: this.vault.digest(verifier),
      tenantId: actor.tenantId,
      actorId: actor.id,
      expiresAt: new Date(Date.now() + 10 * 60_000),
    })
    return { authorizationUrl, verifier }
  }
  async finish(actor: InstagramActor, state: string, verifier: string, code: string) {
    assertInstagramActor(actor)
    if (
      !state ||
      !verifier ||
      !code ||
      !(await this.repository.consumeState(
        this.vault.digest(state),
        this.vault.digest(verifier),
        actor.tenantId,
        actor.id,
      ))
    ) {
      throw new InstagramError(
        'INSTAGRAM_OAUTH_INVALID',
        'A autorização expirou ou é inválida. Conecte novamente.',
      )
    }
    const identity = await this.api.exchange(code)
    await this.repository.saveConnection({
      tenantId: actor.tenantId,
      accountId: identity.accountId,
      oauthUserId: identity.oauthUserId,
      username: identity.username,
      encryptedToken: this.vault.encrypt(
        identity.accessToken,
        instagramTokenContext({
          tenantId: actor.tenantId,
          connectedBy: actor.id,
          accountId: identity.accountId,
        }),
      ),
      expiresAt: new Date(Date.now() + identity.expiresIn * 1000),
      refreshedAt: new Date(),
      revision: this.vault.random(),
      connectedBy: actor.id,
    })
  }
}

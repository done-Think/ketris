import { instagramTokenContext } from '../../domain/token-context'
import { canPublishInstagramProperty } from '../../domain/access'
import { isAgencyStaff, isPropertyOwner } from '@server/auth/domain/roles'
import { InstagramError } from '../../domain/errors'
import type {
  InstagramConnection,
  InstagramProcessOptions,
  InstagramPublication,
} from '../../types/instagram'
import type { InstagramRepository } from '../ports/instagram-repository.port'
import type { InstagramApi, InstagramMedia, InstagramTokenVault } from '../ports/instagram-api.port'

const mediaPollIntervalMs = 5_000
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export class ProcessInstagramPublicationUseCase {
  constructor(
    private readonly repository: InstagramRepository,
    private readonly api: InstagramApi,
    private readonly vault: InstagramTokenVault,
    private readonly media: InstagramMedia,
    private readonly wait: (ms: number) => Promise<void> = sleep,
  ) {}

  async refresh(connection: InstagramConnection) {
    const actor = await this.repository.actor(connection.tenantId, connection.connectedBy)
    if (!actor || (!isAgencyStaff(actor.role) && !isPropertyOwner(actor.role)))
      throw new InstagramError('INSTAGRAM_RECONNECT_REQUIRED')
    let token = this.vault.decrypt(connection.encryptedToken, instagramTokenContext(connection))
    if (connection.expiresAt.getTime() <= Date.now())
      throw new InstagramError('INSTAGRAM_RECONNECT_REQUIRED')
    if (
      connection.expiresAt.getTime() < Date.now() + 7 * 86400_000 &&
      connection.refreshedAt.getTime() < Date.now() - 86400_000
    ) {
      const renewed = await this.api.refresh(token)
      const current = {
        ...connection,
        encryptedToken: this.vault.encrypt(renewed.accessToken, instagramTokenContext(connection)),
        expiresAt: new Date(Date.now() + renewed.expiresIn * 1000),
        refreshedAt: new Date(),
      }
      if (!(await this.repository.refreshConnection(current)))
        throw new InstagramError('INSTAGRAM_CONNECTION_CHANGED')
      token = renewed.accessToken
    }
    return token
  }

  /** Runs one job step by step. Returns false when no job was ready to claim. */
  async execute(id?: string, { waitForMediaMs = 0 }: InstagramProcessOptions = {}) {
    const job = await this.repository.claim(id)
    if (!job) return false
    const waitUntil = Date.now() + waitForMediaMs
    try {
      const connection = await this.repository.connection(job.tenantId, job.requestedBy)
      const property = await this.repository.property(job.tenantId, job.propertyId)
      const actor = await this.repository.actor(job.tenantId, job.requestedBy)
      if (
        !actor ||
        !property ||
        !canPublishInstagramProperty(actor, property) ||
        !connection ||
        connection.revision !== job.connectionRevision ||
        connection.accountId !== job.accountId ||
        property?.status !== 'PUBLISHED' ||
        job.imageUrls.some((url) => !property.mediaUrls.includes(url))
      ) {
        await this.repository.patch(job, {
          status:
            job.status === 'PUBLISHING' || job.status === 'VERIFYING' ? 'BLOCKED' : 'CANCELLED',
          lastErrorCode: 'INSTAGRAM_CONNECTION_OR_PROPERTY_CHANGED',
        })
        return true
      }
      const token = await this.refresh(connection)
      if (job.status === 'PUBLISHING' || job.status === 'VERIFYING') {
        await this.verify(job, token)
        return true
      }
      if (!job.containerId) {
        await this.repository.patch(job, { status: 'PREPARING' })
        if (!job.preparedKeys.length) {
          const preparedKeys = await this.media.prepare(job.tenantId, job.id, job.imageUrls)
          await this.repository.patch(job, { preparedKeys })
        }
        await this.api.checkLimit(job.accountId, token)
        let containerId: string
        if (job.preparedKeys.length === 1) {
          containerId = await this.api.createImage(
            job.accountId,
            token,
            this.media.url(job.id, 0),
            job.caption,
          )
        } else {
          const children: string[] = []
          for (let index = 0; index < job.preparedKeys.length; index++)
            children.push(
              await this.api.createImage(
                job.accountId,
                token,
                this.media.url(job.id, index),
                undefined,
                true,
              ),
            )
          containerId = await this.api.createCarousel(job.accountId, token, children, job.caption)
        }
        await this.repository.patch(job, { containerId, status: 'READY' })
      }
      let status = await this.api.containerStatus(job.containerId!, token)
      // Meta usually needs a few seconds per photo. Keep the lease and poll, so the request that
      // queued the job can publish it without waiting for the daily scheduler.
      while (status === 'IN_PROGRESS' && Date.now() + mediaPollIntervalMs <= waitUntil) {
        await this.wait(mediaPollIntervalMs)
        status = await this.api.containerStatus(job.containerId!, token)
      }
      if (status === 'PUBLISHED') {
        await this.repository.patch(job, { status: 'PUBLISHED', lastErrorCode: null })
        return true
      }
      if (status === 'IN_PROGRESS') {
        if (job.attempts >= 6) throw new InstagramError('INSTAGRAM_PROCESSING_TIMEOUT')
        await this.repository.patch(job, { nextAttemptAt: new Date(Date.now() + 60_000) })
        return true
      }
      if (status !== 'FINISHED') throw new InstagramError('INSTAGRAM_CONTAINER_REJECTED')
      await this.api.checkLimit(job.accountId, token)
      const current = await this.repository.connection(job.tenantId, job.requestedBy)
      const currentProperty = await this.repository.property(job.tenantId, job.propertyId)
      const currentActor = await this.repository.actor(job.tenantId, job.requestedBy)
      if (
        !currentActor ||
        !currentProperty ||
        !canPublishInstagramProperty(currentActor, currentProperty) ||
        current?.revision !== job.connectionRevision ||
        currentProperty?.status !== 'PUBLISHED' ||
        job.imageUrls.some((url) => !currentProperty.mediaUrls.includes(url))
      ) {
        await this.repository.patch(job, {
          status: 'CANCELLED',
          lastErrorCode: 'INSTAGRAM_CONNECTION_OR_PROPERTY_CHANGED',
        })
        return true
      }
      await this.repository.patch(job, {
        status: 'PUBLISHING',
        nextAttemptAt: new Date(Date.now() + 60_000),
      })
      const mediaId = await this.api.publish(job.accountId, token, job.containerId!)
      await this.repository.patch(job, { status: 'PUBLISHED', mediaId, lastErrorCode: null })
      try {
        await this.repository.patch(job, { permalink: await this.api.permalink(mediaId, token) })
      } catch {}
    } catch (error) {
      const uncertain = job.status === 'PUBLISHING' || job.status === 'VERIFYING'
      const reconnectRequired =
        error instanceof InstagramError &&
        ['INSTAGRAM_TOKEN_UNAVAILABLE', 'INSTAGRAM_RECONNECT_REQUIRED'].includes(error.code)
      try {
        await this.repository.patch(job, {
          status: uncertain ? (reconnectRequired ? 'BLOCKED' : 'VERIFYING') : 'FAILED',
          lastErrorCode:
            error instanceof InstagramError ? error.code : 'INSTAGRAM_PROCESSING_FAILED',
          nextAttemptAt: new Date(Date.now() + 60_000),
        })
      } catch {}
    } finally {
      await this.repository.release(job)
    }
    return true
  }

  private async verify(job: InstagramPublication, token: string) {
    const status = job.containerId
      ? await this.api.containerStatus(job.containerId, token)
      : 'UNKNOWN'
    if (status === 'PUBLISHED') {
      await this.repository.patch(job, { status: 'PUBLISHED', lastErrorCode: null })
    } else {
      const blocked =
        ['ERROR', 'EXPIRED', 'UNKNOWN'].includes(status) ||
        job.attempts >= 6 ||
        Date.now() - job.createdAt.getTime() > 24 * 3600_000
      await this.repository.patch(job, {
        status: blocked ? 'BLOCKED' : 'VERIFYING',
        lastErrorCode: 'INSTAGRAM_CHECK_BEFORE_RETRY',
        nextAttemptAt: new Date(Date.now() + 60_000),
      })
    }
  }
}

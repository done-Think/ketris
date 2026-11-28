import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConnectInstagramUseCase } from '../../application/use-cases/connect-instagram.use-case'
import { QueueInstagramPublicationUseCase } from '../../application/use-cases/queue-instagram-publication.use-case'
import { ProcessInstagramPublicationUseCase } from '../../application/use-cases/process-instagram-publication.use-case'
import { actor, connection, dependencies, publication } from '../fixtures/instagram'
import { DeleteInstagramDataUseCase } from '../../application/use-cases/delete-instagram-data.use-case'

describe('Instagram tenant authorization and review', () => {
  it.each(['ADMIN', 'RENTER'] as const)(
    'rejects %s before reading connection data',
    async (role) => {
      const d = dependencies()
      await expect(
        new QueueInstagramPublicationUseCase(d.repository, d.vault).execute(
          { ...actor, role: role as typeof actor.role },
          'property-a',
          'Caption',
          ['photo'],
        ),
      ).rejects.toMatchObject({ status: 403 })
      expect(d.repository.connection).not.toHaveBeenCalled()
    },
  )
  it('reads the property and connection only in the authenticated tenant', async () => {
    const d = dependencies()
    await new QueueInstagramPublicationUseCase(d.repository, d.vault).execute(
      actor,
      'property-a',
      'Reviewed caption',
      publication().imageUrls,
    )
    expect(d.repository.property).toHaveBeenCalledWith('tenant-a', 'property-a')
    expect(d.repository.connection).toHaveBeenCalledWith('tenant-a', actor.id)
    expect(d.repository.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-a',
        requestedBy: 'owner-a',
        caption: 'Reviewed caption',
        imageUrls: publication().imageUrls,
      }),
    )
  })
  it('rejects a property from another tenant and never queues it', async () => {
    const d = dependencies()
    d.repository.property.mockResolvedValue(null)
    await expect(
      new QueueInstagramPublicationUseCase(d.repository, d.vault).execute(
        actor,
        'other-property',
        '',
        ['photo'],
      ),
    ).rejects.toMatchObject({ status: 404 })
    expect(d.repository.enqueue).not.toHaveBeenCalled()
  })
  it('rejects unrelated photos and unpublished properties', async () => {
    const d = dependencies()
    const useCase = new QueueInstagramPublicationUseCase(d.repository, d.vault)
    await expect(useCase.execute(actor, 'property-a', '', ['other-photo'])).rejects.toMatchObject({
      code: 'INSTAGRAM_INVALID_MEDIA',
    })
    d.repository.property.mockResolvedValue({
      id: 'property-a',
      tenantId: actor.tenantId,
      responsibleId: actor.id,
      ownerId: actor.id,
      status: 'DRAFT',
      mediaUrls: ['photo'],
    })
    await expect(useCase.execute(actor, 'property-a', '', ['photo'])).rejects.toMatchObject({
      code: 'INSTAGRAM_PROPERTY_NOT_PUBLISHED',
    })
  })
  it('uses the same deduplication key when a confirmed request is repeated with different text', async () => {
    const d = dependencies()
    const useCase = new QueueInstagramPublicationUseCase(d.repository, d.vault)
    await useCase.execute(actor, 'property-a', 'First', publication().imageUrls)
    await useCase.execute(actor, 'property-a', 'Second', publication().imageUrls)
    expect(d.repository.enqueue.mock.calls[0][0].dedupeKey).toBe(
      d.repository.enqueue.mock.calls[1][0].dedupeKey,
    )
  })
  it('rejects expired connections, duplicate photos and too many photos', async () => {
    const d = dependencies()
    const useCase = new QueueInstagramPublicationUseCase(d.repository, d.vault)
    await expect(useCase.execute(actor, 'property-a', '', ['same', 'same'])).rejects.toMatchObject({
      code: 'INSTAGRAM_INVALID_POST',
    })
    await expect(
      useCase.execute(
        actor,
        'property-a',
        '',
        Array.from({ length: 21 }, (_, i) => String(i)),
      ),
    ).rejects.toMatchObject({ code: 'INSTAGRAM_INVALID_POST' })
    d.repository.connection.mockResolvedValue({ ...connection(), expiresAt: new Date(0) })
    await expect(
      useCase.execute(actor, 'property-a', '', publication().imageUrls),
    ).rejects.toMatchObject({ code: 'INSTAGRAM_RECONNECT_REQUIRED' })
  })
})

describe('Instagram OAuth', () => {
  it.each(['ADMIN', 'RENTER'] as const)(
    'rejects %s before creating or consuming an OAuth state',
    async (role) => {
      const d = dependencies()
      const useCase = new ConnectInstagramUseCase(d.repository, d.api, d.vault)
      await expect(
        useCase.start({ ...actor, role: role as typeof actor.role }),
      ).rejects.toMatchObject({ status: 403 })
      await expect(
        useCase.finish({ ...actor, role: role as typeof actor.role }, 'state', 'verifier', 'code'),
      ).rejects.toMatchObject({ status: 403 })
      expect(d.repository.saveState).not.toHaveBeenCalled()
      expect(d.repository.consumeState).not.toHaveBeenCalled()
      expect(d.api.exchange).not.toHaveBeenCalled()
    },
  )

  it('stores hashes of short-lived state and encrypts the token for the tenant', async () => {
    const d = dependencies()
    const useCase = new ConnectInstagramUseCase(d.repository, d.api, d.vault)
    const start = await useCase.start(actor)
    const state = d.api.authorizeUrl.mock.calls[0][0]
    const saved = d.repository.saveState.mock.calls[0][0]
    expect(saved.hash).not.toBe(state)
    expect(saved.verifierHash).not.toBe(start.verifier)
    expect(saved.tenantId).toBe(actor.tenantId)
    await useCase.finish(actor, state, start.verifier, 'code')
    expect(d.vault.encrypt).toHaveBeenCalledWith(
      'private-token',
      JSON.stringify([actor.tenantId, actor.id, '123']),
    )
    expect(d.repository.saveConnection).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: actor.tenantId, encryptedToken: 'ciphertext' }),
    )
  })
  it('does not exchange a replayed or mismatched state', async () => {
    const d = dependencies()
    d.repository.consumeState.mockResolvedValue(false)
    await expect(
      new ConnectInstagramUseCase(d.repository, d.api, d.vault).finish(
        actor,
        'state',
        'verifier',
        'code',
      ),
    ).rejects.toMatchObject({ code: 'INSTAGRAM_OAUTH_INVALID' })
    expect(d.api.exchange).not.toHaveBeenCalled()
  })
})

describe('Durable Instagram publication', () => {
  it('publishes a carousel in the reviewed order using one parent confirmation', async () => {
    const d = dependencies()
    const job = { ...publication(), imageUrls: ['/first.jpg', '/second.jpg'] }
    d.repository.claim.mockResolvedValue(job)
    d.repository.property.mockResolvedValue({
      id: job.propertyId,
      tenantId: actor.tenantId,
      responsibleId: actor.id,
      ownerId: actor.id,
      status: 'PUBLISHED',
      mediaUrls: job.imageUrls,
    })
    d.media.prepare.mockResolvedValue(['first-prepared.jpg', 'second-prepared.jpg'])
    d.api.createImage.mockResolvedValueOnce('first-child').mockResolvedValueOnce('second-child')
    await new ProcessInstagramPublicationUseCase(d.repository, d.api, d.vault, d.media).execute()
    expect(d.api.createCarousel).toHaveBeenCalledWith(
      '123',
      'private-token',
      ['first-child', 'second-child'],
      job.caption,
    )
    expect(d.api.publish).toHaveBeenCalledOnce()
    expect(d.api.publish).toHaveBeenCalledWith('123', 'private-token', 'carousel-1')
  })
  it('blocks an uncertain submission after bounded status checks without publishing again', async () => {
    const d = dependencies()
    d.repository.claim.mockResolvedValue({
      ...publication(),
      attempts: 6,
      status: 'VERIFYING',
      containerId: 'container-1',
    })
    await new ProcessInstagramPublicationUseCase(d.repository, d.api, d.vault, d.media).execute()
    expect(d.api.publish).not.toHaveBeenCalled()
    expect(d.repository.patch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'BLOCKED' }),
    )
  })
  it('rechecks site publication immediately before confirming the Instagram post', async () => {
    const d = dependencies()
    d.repository.property
      .mockResolvedValueOnce({
        id: 'property-a',
        tenantId: actor.tenantId,
        responsibleId: actor.id,
        ownerId: actor.id,
        status: 'PUBLISHED',
        mediaUrls: publication().imageUrls,
      })
      .mockResolvedValueOnce({
        id: 'property-a',
        tenantId: actor.tenantId,
        responsibleId: actor.id,
        ownerId: actor.id,
        status: 'DRAFT',
        mediaUrls: publication().imageUrls,
      })
    await new ProcessInstagramPublicationUseCase(d.repository, d.api, d.vault, d.media).execute()
    expect(d.api.publish).not.toHaveBeenCalled()
  })
  it('persists the container and publishing state before sending the confirmation', async () => {
    const d = dependencies()
    await new ProcessInstagramPublicationUseCase(d.repository, d.api, d.vault, d.media).execute()
    const publishing = d.repository.patch.mock.calls.findIndex(
      ([, patch]) => patch.status === 'PUBLISHING',
    )
    expect(publishing).toBeGreaterThan(-1)
    expect(d.repository.patch.mock.invocationCallOrder[publishing]).toBeLessThan(
      d.api.publish.mock.invocationCallOrder[0],
    )
    expect(d.repository.patch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'PUBLISHED', mediaId: 'media-1' }),
    )
  })
  it('checks an uncertain submission without publishing it again', async () => {
    const d = dependencies()
    d.repository.claim.mockResolvedValue({
      ...publication(),
      status: 'PUBLISHING',
      containerId: 'container-1',
    })
    await new ProcessInstagramPublicationUseCase(d.repository, d.api, d.vault, d.media).execute()
    expect(d.api.publish).not.toHaveBeenCalled()
    expect(d.repository.patch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'VERIFYING' }),
    )
  })
  it('recognizes a remotely published container after a lost response', async () => {
    const d = dependencies()
    d.repository.claim.mockResolvedValue({
      ...publication(),
      status: 'VERIFYING',
      containerId: 'container-1',
    })
    d.api.containerStatus.mockResolvedValue('PUBLISHED')
    await new ProcessInstagramPublicationUseCase(d.repository, d.api, d.vault, d.media).execute()
    expect(d.api.publish).not.toHaveBeenCalled()
    expect(d.repository.patch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'PUBLISHED' }),
    )
  })
  it('leaves the site property published when Instagram fails', async () => {
    const d = dependencies()
    const property = {
      id: 'property-a',
      tenantId: actor.tenantId,
      responsibleId: actor.id,
      ownerId: actor.id,
      status: 'PUBLISHED',
      mediaUrls: publication().imageUrls,
    }
    d.repository.property.mockResolvedValue(property)
    d.api.createImage.mockRejectedValue(new Error('upstream failure'))
    await new ProcessInstagramPublicationUseCase(d.repository, d.api, d.vault, d.media).execute()
    expect(property.status).toBe('PUBLISHED')
    expect(d.repository.patch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'FAILED', lastErrorCode: 'INSTAGRAM_PROCESSING_FAILED' }),
    )
  })
  it('treats a publish timeout as uncertain and releases the lease', async () => {
    const d = dependencies()
    d.api.publish.mockRejectedValue(new Error('timeout'))
    await new ProcessInstagramPublicationUseCase(d.repository, d.api, d.vault, d.media).execute()
    expect(d.repository.patch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'VERIFYING' }),
    )
    expect(d.repository.release).toHaveBeenCalledOnce()
  })
  it('does nothing when another worker already owns the job', async () => {
    const d = dependencies()
    d.repository.claim.mockResolvedValue(null)
    await expect(
      new ProcessInstagramPublicationUseCase(d.repository, d.api, d.vault, d.media).execute(),
    ).resolves.toBe(false)
    expect(d.api.createImage).not.toHaveBeenCalled()
  })
  it('cancels a job when its connection was replaced', async () => {
    const d = dependencies()
    d.repository.connection.mockResolvedValue({ ...connection(), revision: 'new-connection' })
    await new ProcessInstagramPublicationUseCase(d.repository, d.api, d.vault, d.media).execute()
    expect(d.api.publish).not.toHaveBeenCalled()
    expect(d.repository.patch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'CANCELLED' }),
    )
  })
  describe('while the request waits for Meta to process the photos', () => {
    beforeEach(() => vi.useFakeTimers({ toFake: ['Date'] }))
    afterEach(() => vi.useRealTimers())
    const passTime = vi.fn(async (ms: number) => {
      vi.setSystemTime(Date.now() + ms)
    })

    it('publishes in the same run once Meta finishes', async () => {
      const d = dependencies()
      passTime.mockClear()
      d.api.containerStatus
        .mockResolvedValueOnce('IN_PROGRESS')
        .mockResolvedValueOnce('IN_PROGRESS')
        .mockResolvedValueOnce('FINISHED')
      const result = await new ProcessInstagramPublicationUseCase(
        d.repository,
        d.api,
        d.vault,
        d.media,
        passTime,
      ).execute('job-1', { waitForMediaMs: 60_000 })
      expect(result).toBe(true)
      expect(passTime).toHaveBeenCalledTimes(2)
      expect(d.api.publish).toHaveBeenCalledOnce()
      expect(d.repository.release).toHaveBeenCalledOnce()
    })

    it('hands the job to the scheduler when Meta is still processing after the wait', async () => {
      const d = dependencies()
      passTime.mockClear()
      d.api.containerStatus.mockResolvedValue('IN_PROGRESS')
      await new ProcessInstagramPublicationUseCase(
        d.repository,
        d.api,
        d.vault,
        d.media,
        passTime,
      ).execute('job-1', { waitForMediaMs: 12_000 })
      expect(passTime).toHaveBeenCalledTimes(2)
      expect(d.api.publish).not.toHaveBeenCalled()
      expect(d.repository.patch).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ nextAttemptAt: expect.any(Date) }),
      )
    })
  })

  it('waits for media processing without publishing prematurely', async () => {
    const d = dependencies()
    d.api.containerStatus.mockResolvedValue('IN_PROGRESS')
    await new ProcessInstagramPublicationUseCase(d.repository, d.api, d.vault, d.media).execute()
    expect(d.api.publish).not.toHaveBeenCalled()
    expect(d.repository.patch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ nextAttemptAt: expect.any(Date) }),
    )
  })
})

describe('Instagram data deletion', () => {
  it('removes generated copies before acknowledging metadata deletion', async () => {
    const d = dependencies()
    d.repository.deletionMediaKeys.mockResolvedValue(['properties/tenant-a/instagram/job/0.jpg'])
    await new DeleteInstagramDataUseCase(d.repository, d.media).execute('456')
    expect(d.media.remove).toHaveBeenCalledWith(['properties/tenant-a/instagram/job/0.jpg'])
    expect(d.media.remove.mock.invocationCallOrder[0]).toBeLessThan(
      d.repository.deleteByOAuthUser.mock.invocationCallOrder[0],
    )
  })
  it('does not acknowledge deletion when storage cleanup fails', async () => {
    const d = dependencies()
    d.media.remove.mockRejectedValue(new Error('storage denied'))
    await expect(
      new DeleteInstagramDataUseCase(d.repository, d.media).execute('456'),
    ).rejects.toThrow()
    expect(d.repository.deleteByOAuthUser).not.toHaveBeenCalled()
  })
})

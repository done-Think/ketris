import { describe, expect, it } from 'vitest'
import { QueueInstagramPublicationUseCase } from '../../application/use-cases/queue-instagram-publication.use-case'
import { ProcessInstagramPublicationUseCase } from '../../application/use-cases/process-instagram-publication.use-case'
import { ListInstagramPublicationsUseCase } from '../../application/use-cases/list-instagram-publications.use-case'
import { RetryInstagramPublicationUseCase } from '../../application/use-cases/retry-instagram-publication.use-case'
import { ConnectInstagramUseCase } from '../../application/use-cases/connect-instagram.use-case'
import { actor, connection, dependencies, publication } from '../fixtures/instagram'
import type { InstagramActor } from '../../types/instagram'

describe('Personal Instagram permissions', () => {
  it.each(['OWNER', 'AGENT', 'PROPERTY_OWNER'] as const)(
    'allows the authorized %s to connect and publish',
    async (role) => {
      const d = dependencies()
      const user = { ...actor, role }
      await new ConnectInstagramUseCase(d.repository, d.api, d.vault).start(user)
      await new QueueInstagramPublicationUseCase(d.repository, d.vault).execute(
        user,
        'property-a',
        'Reviewed',
        publication().imageUrls,
      )
      expect(d.repository.connection).toHaveBeenCalledWith(user.tenantId, user.id)
    },
  )

  it.each(['AGENT', 'PROPERTY_OWNER'] as const)(
    'rejects an unrelated %s for queue, history and retry',
    async (role) => {
      const d = dependencies()
      const user = { ...actor, role }
      d.repository.property.mockResolvedValue({
        id: 'property-a',
        tenantId: actor.tenantId,
        responsibleId: 'another-agent',
        ownerId: 'another-owner',
        status: 'PUBLISHED',
        mediaUrls: publication().imageUrls,
      })
      await expect(
        new QueueInstagramPublicationUseCase(d.repository, d.vault).execute(
          user,
          'property-a',
          '',
          publication().imageUrls,
        ),
      ).rejects.toMatchObject({ status: 404 })
      await expect(
        new ListInstagramPublicationsUseCase(d.repository).execute(user, 'property-a'),
      ).rejects.toMatchObject({ status: 404 })
      await expect(
        new RetryInstagramPublicationUseCase(d.repository).execute(user, 'job-1'),
      ).rejects.toMatchObject({ status: 404 })
      expect(d.repository.enqueue).not.toHaveBeenCalled()
      expect(d.repository.publications).not.toHaveBeenCalled()
      expect(d.repository.retry).not.toHaveBeenCalled()
    },
  )

  it('scopes history to its requester even for the tenant manager', async () => {
    const d = dependencies()
    await new ListInstagramPublicationsUseCase(d.repository).execute(actor, 'property-a')
    expect(d.repository.publications).toHaveBeenCalledWith(actor.tenantId, 'property-a', actor.id)
  })

  it.each([
    { ...actor, id: 'another-user' },
    { ...actor, tenantId: 'another-tenant' },
  ])('rejects retry by a different identity', async (user) => {
    const d = dependencies()
    await expect(
      new RetryInstagramPublicationUseCase(d.repository).execute(user, 'job-1'),
    ).rejects.toMatchObject({ status: 404 })
    expect(d.repository.retry).not.toHaveBeenCalled()
  })

  it('permits an authorized retry only for the requester and their connection', async () => {
    const d = dependencies()
    d.repository.retry.mockResolvedValue(true)
    await new RetryInstagramPublicationUseCase(d.repository).execute(actor, 'job-1')
    expect(d.repository.retry).toHaveBeenCalledWith(actor.tenantId, actor.id, 'job-1')
  })

  it('keeps deduplication per destination account', async () => {
    const d = dependencies()
    const queue = new QueueInstagramPublicationUseCase(d.repository, d.vault)
    await queue.execute(actor, 'property-a', 'First', publication().imageUrls)
    d.repository.connection.mockResolvedValue({ ...connection(), accountId: 'different-account' })
    await queue.execute(actor, 'property-a', 'Second', publication().imageUrls)
    expect(d.repository.enqueue.mock.calls[0][0].dedupeKey).not.toBe(
      d.repository.enqueue.mock.calls[1][0].dedupeKey,
    )
  })
})

describe('Authorization changes during processing', () => {
  it.each(['AGENT', 'PROPERTY_OWNER'] as const)(
    'cancels pending publication after %s loses their property link',
    async (role) => {
      const d = dependencies()
      d.repository.actor.mockResolvedValue({ ...actor, role })
      d.repository.property.mockResolvedValue({
        id: 'property-a',
        tenantId: actor.tenantId,
        responsibleId: 'other',
        ownerId: 'other',
        status: 'PUBLISHED',
        mediaUrls: publication().imageUrls,
      })
      await new ProcessInstagramPublicationUseCase(d.repository, d.api, d.vault, d.media).execute()
      expect(d.api.publish).not.toHaveBeenCalled()
      expect(d.media.prepare).not.toHaveBeenCalled()
      expect(d.repository.patch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status: 'CANCELLED' }),
      )
    },
  )

  it('rechecks the representative immediately before remote confirmation', async () => {
    const d = dependencies()
    const user: InstagramActor = { ...actor, role: 'AGENT' }
    d.repository.actor.mockResolvedValue(user)
    const property = await d.repository.property(actor.tenantId, 'property-a')
    d.repository.property
      .mockReset()
      .mockResolvedValueOnce(property)
      .mockResolvedValueOnce({ ...property!, responsibleId: 'new-agent' })
    await new ProcessInstagramPublicationUseCase(d.repository, d.api, d.vault, d.media).execute()
    expect(d.api.createImage).toHaveBeenCalled()
    expect(d.api.publish).not.toHaveBeenCalled()
    expect(d.repository.patch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'CANCELLED' }),
    )
  })

  it.each([null, { ...actor, role: 'RENTER' as const }])(
    'cancels jobs for an inactive or no longer eligible user',
    async (user) => {
      const d = dependencies()
      d.repository.actor.mockResolvedValue(user)
      await new ProcessInstagramPublicationUseCase(d.repository, d.api, d.vault, d.media).execute()
      expect(d.api.publish).not.toHaveBeenCalled()
      expect(d.repository.patch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status: 'CANCELLED' }),
      )
    },
  )

  it('blocks an uncertain publication after access is revoked without confirming again', async () => {
    const d = dependencies()
    d.repository.actor.mockResolvedValue(null)
    d.repository.claim.mockResolvedValue({
      ...publication(),
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
})

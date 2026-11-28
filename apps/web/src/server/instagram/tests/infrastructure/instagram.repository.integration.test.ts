import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '@server/db/prisma'
import { PrismaInstagramRepository } from '../../infrastructure/prisma-instagram.repository'
import { connection, publication } from '../fixtures/instagram'

const repository = new PrismaInstagramRepository()
const tenantA = `instagram-test-${randomUUID()}`
const tenantB = `instagram-test-${randomUUID()}`
const accountId = `instagram-account-${randomUUID()}`
beforeAll(async () => {
  await prisma.tenant.createMany({
    data: [
      { id: tenantA, name: 'Instagram test A', slug: tenantA },
      { id: tenantB, name: 'Instagram test B', slug: tenantB },
    ],
  })
})
afterAll(async () => {
  await prisma.instagramOAuthState.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } })
  await prisma.tenant.deleteMany({ where: { id: { in: [tenantA, tenantB] } } })
})

describe('Instagram persistence and concurrency', () => {
  it('keeps connections, states and queued jobs independent for users of the same tenant', async () => {
    const firstUser = `user-${randomUUID()}`
    const secondUser = `user-${randomUUID()}`
    const firstAccount = randomUUID()
    const secondAccount = randomUUID()
    for (const [connectedBy, accountId] of [
      [firstUser, firstAccount],
      [secondUser, secondAccount],
    ]) {
      await repository.saveConnection({
        ...connection(),
        tenantId: tenantA,
        connectedBy,
        accountId,
        oauthUserId: accountId,
      })
      await repository.saveState({
        hash: randomUUID(),
        verifierHash: 'proof',
        tenantId: tenantA,
        actorId: connectedBy,
        expiresAt: new Date(Date.now() + 60_000),
      })
      const sample = publication()
      await repository.enqueue({
        tenantId: tenantA,
        propertyId: 'shared-property',
        requestedBy: connectedBy,
        accountId,
        oauthUserId: accountId,
        connectionRevision: sample.connectionRevision,
        dedupeKey: randomUUID(),
        caption: sample.caption,
        imageUrls: sample.imageUrls,
      })
    }
    expect((await repository.connection(tenantA, firstUser))?.accountId).toBe(firstAccount)
    expect((await repository.connection(tenantA, secondUser))?.accountId).toBe(secondAccount)
    expect(await repository.connection(tenantB, firstUser)).toBeNull()
    expect(
      (await repository.publications(tenantA, 'shared-property', firstUser)).map(
        (job) => job.accountId,
      ),
    ).toEqual([firstAccount])
    await repository.disconnect(tenantA, firstUser)
    expect(await repository.connection(tenantA, firstUser)).toBeNull()
    expect((await repository.connection(tenantA, secondUser))?.accountId).toBe(secondAccount)
    expect((await repository.publications(tenantA, 'shared-property', firstUser))[0].status).toBe(
      'CANCELLED',
    )
    expect((await repository.publications(tenantA, 'shared-property', secondUser))[0].status).toBe(
      'QUEUED',
    )
    expect(
      await prisma.instagramOAuthState.count({ where: { tenantId: tenantA, actorId: firstUser } }),
    ).toBe(0)
    expect(
      await prisma.instagramOAuthState.count({ where: { tenantId: tenantA, actorId: secondUser } }),
    ).toBe(1)
  })
  it('enforces one connection per account across tenants', async () => {
    await repository.saveConnection({
      ...connection(),
      tenantId: tenantA,
      accountId,
      oauthUserId: accountId,
    })
    await expect(
      repository.saveConnection({
        ...connection(),
        tenantId: tenantB,
        accountId,
        oauthUserId: accountId,
      }),
    ).rejects.toMatchObject({ code: 'INSTAGRAM_CONNECTION_CONFLICT' })
    expect(await repository.connection(tenantB, connection().connectedBy)).toBeNull()
  })
  it('deduplicates concurrent requests and grants only one worker lease', async () => {
    const sample = publication()
    const input = {
      tenantId: tenantA,
      propertyId: 'property-test',
      accountId,
      oauthUserId: accountId,
      connectionRevision: sample.connectionRevision,
      requestedBy: sample.requestedBy,
      dedupeKey: randomUUID(),
      caption: sample.caption,
      imageUrls: sample.imageUrls,
    }
    const jobs = await Promise.all([repository.enqueue(input), repository.enqueue(input)])
    expect(jobs[0].id).toBe(jobs[1].id)
    const claimed = await Promise.all([repository.claim(jobs[0].id), repository.claim(jobs[0].id)])
    expect(claimed.filter(Boolean)).toHaveLength(1)
    expect(
      await repository.publications(tenantB, 'property-test', connection().connectedBy),
    ).toEqual([])
    await repository.release(claimed.find((job) => job !== null)!)
  })
  it('consumes OAuth states once and binds them to the actor and tenant', async () => {
    const hash = randomUUID()
    await repository.saveState({
      hash,
      verifierHash: 'verifier-hash',
      tenantId: tenantA,
      actorId: 'owner-a',
      expiresAt: new Date(Date.now() + 60_000),
    })
    expect(await repository.consumeState(hash, 'verifier-hash', tenantB, 'owner-a')).toBe(false)
    expect(await repository.consumeState(hash, 'verifier-hash', tenantA, 'other-owner')).toBe(false)
    const results = await Promise.all([
      repository.consumeState(hash, 'verifier-hash', tenantA, 'owner-a'),
      repository.consumeState(hash, 'verifier-hash', tenantA, 'owner-a'),
    ])
    expect(results.filter(Boolean)).toHaveLength(1)
  })
  it('does not resurrect a disconnected account during a delayed refresh', async () => {
    const saved = await repository.connection(tenantA, connection().connectedBy)
    expect(saved).not.toBeNull()
    await repository.disconnect(tenantA, connection().connectedBy)
    expect(await repository.refreshConnection(saved!)).toBe(false)
    expect(await repository.connection(tenantA, connection().connectedBy)).toBeNull()
  })
})

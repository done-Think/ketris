import { randomBytes, randomUUID } from 'node:crypto'
import type { PrismaClient, UserRole } from '@prisma/client'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { DataCipher, captureTokenHash } from '../infrastructure/data-cipher'
import { FaceCheckAccessScope } from '../infrastructure/access-scope'
import { PrismaSessionRepository } from '../infrastructure/prisma-session-repository'
import { PrismaSettingsRepository } from '../infrastructure/prisma-settings-repository'
import { resolveFaceCheckActor } from '../require-face-check-actor'
import { FaceCheckEvidencePurger } from '../purge'
import { evidenceRetentionMs, evidenceUnavailable } from '../verification/domain/evidence-policy'
import { buildVerificationUseCases } from '../verification/container-factory'
import { verificationHarness } from './fixtures/verification-harness'
import { newSessionRecord } from '../verification/domain/session-rules'
import type { FaceCheckActor } from '../types/access'
import { disposableFaceCheckDatabase } from './fixtures/disposable-database'

describe.skipIf(!process.env.FACE_CHECK_TEST_DATABASE_URL)(
  'face_check tenant authorization and lease persistence',
  () => {
    let database: PrismaClient
    const cipher = new DataCipher(randomBytes(32))
    const namespace = randomUUID()
    const tenants: string[] = []
    let agency: string, otherAgency: string, property: string, anotherProperty: string
    let owner: FaceCheckActor,
      agent: FaceCheckActor,
      anotherAgent: FaceCheckActor,
      otherOwner: FaceCheckActor

    async function tenant(
      name: string,
      accountType: 'AGENCY' | 'BROKER' | 'INDIVIDUAL' = 'AGENCY',
    ) {
      const row = await database.tenant.create({
        data: { name, slug: `${namespace}-${name}`, accountType },
        select: { id: true },
      })
      tenants.push(row.id)
      return row.id
    }

    async function user(
      tenantId: string,
      role: UserRole,
      suffix: string,
      extra: {
        active?: boolean
        emailVerifiedAt?: Date | null
        membershipApprovedAt?: Date | null
      } = {},
    ) {
      return database.user.create({
        data: {
          tenantId,
          role,
          name: suffix,
          email: `${namespace}-${suffix}@example.test`,
          passwordHash: 'test-only',
          ...extra,
        },
        select: { id: true, tenantId: true },
      })
    }

    async function actor(tenantId: string, role: 'OWNER' | 'AGENT', suffix: string) {
      const row = await user(tenantId, role, suffix)
      return resolveFaceCheckActor({ userId: row.id, tenantId }, database)
    }

    function repository(current: FaceCheckActor) {
      return new PrismaSessionRepository(
        new FaceCheckAccessScope(database, { actor: current }),
        cipher,
      )
    }

    async function session(current = owner, propertyId = property) {
      const record = newSessionRecord(
        {
          id: randomUUID(),
          personName: 'Integration Person',
          agencyName: 'Agency',
          cpf: null,
          reference: null,
          contact: null,
          acceptedDocument: 'RG',
          createdAt: Date.now(),
          expiresAt: Date.now() + 86_400_000,
          outcome: 'approve',
          token: randomBytes(32).toString('hex'),
          captureMode: 'camera',
          maxAttempts: 3,
        },
        randomUUID(),
      )
      record.session.propertyId = propertyId
      await repository(current).insert(record)
      return record
    }

    beforeAll(async () => {
      database = disposableFaceCheckDatabase()
      agency = await tenant('agency')
      otherAgency = await tenant('other')
      owner = await actor(agency, 'OWNER', 'owner')
      agent = await actor(agency, 'AGENT', 'agent')
      anotherAgent = await actor(agency, 'AGENT', 'another')
      otherOwner = await actor(otherAgency, 'OWNER', 'other-owner')
      property = (
        await database.property.create({
          data: {
            tenantId: agency,
            responsibleId: agent.actorId,
            title: 'Agent property',
            purpose: 'RENT',
            type: 'HOUSE',
            price: 1,
          },
          select: { id: true },
        })
      ).id
      anotherProperty = (
        await database.property.create({
          data: {
            tenantId: agency,
            responsibleId: anotherAgent.actorId,
            title: 'Other property',
            purpose: 'SALE',
            type: 'HOUSE',
            price: 1,
          },
          select: { id: true },
        })
      ).id
    })

    afterAll(async () => {
      if (database) {
        for (const tenantId of tenants) await database.tenant.delete({ where: { id: tenantId } })
        await database.$disconnect()
      }
    })

    it('allows eligible agency and independent broker accounts and rejects all excluded identities', async () => {
      const brokerTenant = await tenant('broker', 'BROKER')
      expect((await actor(brokerTenant, 'OWNER', 'broker')).accountType).toBe('BROKER')
      const individualTenant = await tenant('individual', 'INDIVIDUAL')
      const individual = await user(individualTenant, 'OWNER', 'individual')
      await expect(
        resolveFaceCheckActor({ userId: individual.id, tenantId: individualTenant }, database),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
      for (const role of ['RENTER', 'PROPERTY_OWNER'] as const) {
        const excluded = await user(agency, role, role.toLowerCase())
        await expect(
          resolveFaceCheckActor({ userId: excluded.id, tenantId: agency }, database),
        ).rejects.toMatchObject({ code: 'FORBIDDEN' })
      }
      for (const [suffix, extra] of [
        ['inactive', { active: false }],
        ['unverified', { emailVerifiedAt: null }],
        ['unapproved', { membershipApprovedAt: null }],
      ] as const) {
        const excluded = await user(agency, 'OWNER', suffix, extra)
        await expect(
          resolveFaceCheckActor({ userId: excluded.id, tenantId: agency }, database),
        ).rejects.toMatchObject({ code: 'FORBIDDEN' })
      }
      await expect(
        resolveFaceCheckActor({ userId: owner.actorId, tenantId: otherAgency }, database),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
      await expect(
        resolveFaceCheckActor({ userId: 'platform-admin', tenantId: agency }, database),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })

    it('scopes every read/list/update to the actor current property portfolio and hides foreign tenants', async () => {
      const own = await session(agent)
      const other = await session(owner, anotherProperty)
      expect((await repository(agent).list()).map((item) => item.session.id)).toContain(
        own.session.id,
      )
      expect((await repository(agent).list()).map((item) => item.session.id)).not.toContain(
        other.session.id,
      )
      expect(await repository(agent).read({ id: other.session.id })).toBeNull()
      expect(await repository(otherOwner).read({ id: own.session.id })).toBeNull()
      await expect(
        repository(agent).update({ id: other.session.id }, () => {}),
      ).rejects.toMatchObject({ code: 'SESSION_NOT_FOUND', status: 404 })
      await expect(session(agent, anotherProperty)).rejects.toMatchObject({
        code: 'SESSION_NOT_FOUND',
        status: 404,
      })
      await database.property.update({
        where: { id: property },
        data: { responsibleId: anotherAgent.actorId },
      })
      try {
        expect(await repository(agent).read({ id: own.session.id })).toBeNull()
        expect(await repository(anotherAgent).read({ id: own.session.id })).not.toBeNull()
        const capture = new PrismaSessionRepository(
          new FaceCheckAccessScope(database, { token: own.session.token }),
          cipher,
        )
        expect(await capture.read({ token: own.session.token })).toBeNull()
      } finally {
        await database.property.update({
          where: { id: property },
          data: { responsibleId: agent.actorId },
        })
      }
    })

    it('derives settings agencyName from the tenant and only allows owner writes', async () => {
      const ownerSettings = new PrismaSettingsRepository(
        new FaceCheckAccessScope(database, { actor: owner }),
        cipher,
      )
      const agentSettings = new PrismaSettingsRepository(
        new FaceCheckAccessScope(database, { actor: agent }),
        cipher,
      )
      await ownerSettings.save({
        agencyName: 'Injected other company',
        faceMatchThreshold: 0.3,
        maxAttempts: 2,
        allowGalleryUpload: false,
      })
      expect((await agentSettings.get()).agencyName).toBe('agency')
      await expect(
        agentSettings.save({
          agencyName: 'Injected',
          faceMatchThreshold: 0.3,
          maxAttempts: 5,
          allowGalleryUpload: true,
        }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
      const row = await database.faceCheckSettings.findUniqueOrThrow({
        where: { tenantId: agency },
      })
      expect(row.encryptedRecord).not.toContain('agency')
    })

    it('rechecks tenant and requester eligibility on public links and rejects expired tokens', async () => {
      const record = await session()
      const publicRepo = new PrismaSessionRepository(
        new FaceCheckAccessScope(database, { token: record.session.token }),
        cipher,
      )
      await database.user.update({ where: { id: owner.actorId }, data: { active: false } })
      try {
        expect(await publicRepo.read({ token: record.session.token })).toBeNull()
      } finally {
        await database.user.update({ where: { id: owner.actorId }, data: { active: true } })
      }
      await database.tenant.update({ where: { id: agency }, data: { status: 'SUSPENDED' } })
      try {
        expect(await publicRepo.read({ token: record.session.token })).toBeNull()
        await expect(repository(owner).list()).rejects.toMatchObject({ code: 'FORBIDDEN' })
      } finally {
        await database.tenant.update({ where: { id: agency }, data: { status: 'ACTIVE' } })
      }
      await database.faceCheckSession.update({
        where: { id: record.session.id },
        data: { expiresAt: new Date(Date.now() - 1) },
      })
      await expect(publicRepo.read({ token: record.session.token })).rejects.toMatchObject({
        code: 'SESSION_EXPIRED',
        status: 410,
      })
    })

    it('encrypts personal data and token, enforces tenant foreign keys and records the real human actor', async () => {
      const record = await session()
      const row = await database.faceCheckSession.findUniqueOrThrow({
        where: { id: record.session.id },
      })
      expect(row.tokenHash).toBe(captureTokenHash(record.session.token))
      expect(row.encryptedRecord).not.toContain(record.session.token)
      expect(row.encryptedRecord).not.toContain('Integration Person')
      expect(
        (await repository(owner).read({ id: record.session.id }))?.session.timeline[0].actor,
      ).toBe(owner.actorId)
      await expect(
        database.faceCheckSession.create({
          data: {
            id: randomUUID(),
            tenantId: otherAgency,
            propertyId: property,
            requestedById: otherOwner.actorId,
            status: 'CREATED',
            expiresAt: new Date(Date.now() + 1000),
            tokenHash: randomUUID(),
            encryptedRecord: 'invalid',
          },
        }),
      ).rejects.toThrow()
    })

    it('uses a lease without holding a database connection during the slow callback', async () => {
      const record = await session()
      const repo = repository(owner)
      let entered!: () => void, release!: () => void
      const started = new Promise<void>((resolve) => {
        entered = resolve
      })
      const gate = new Promise<void>((resolve) => {
        release = resolve
      })
      const first = repo.update({ id: record.session.id }, async (working) => {
        entered()
        await gate
        working.session.reference = 'first'
        return 'done'
      })
      await started
      try {
        // This client has max:1. SELECT completing proves no connection is held by the lease.
        expect(await database.$queryRaw`SELECT 1 AS value`).toEqual([{ value: 1 }])
        await expect(repo.update({ id: record.session.id }, () => {})).rejects.toMatchObject({
          code: 'PERSISTENCE_BUSY',
        })
      } finally {
        release()
      }
      expect(await first).toBe('done')
      expect((await repo.read({ id: record.session.id }))?.session.reference).toBe('first')
      expect(
        await database.faceCheckSession.findUnique({
          where: { id: record.session.id },
          select: { revision: true, leaseId: true },
        }),
      ).toEqual({ revision: 1, leaseId: null })
    })

    it('reclaims expired leases and rejects stale finalization without overwriting the newer result', async () => {
      const record = await session()
      const repo = repository(owner)
      let entered!: () => void, release!: () => void
      const started = new Promise<void>((resolve) => {
        entered = resolve
      })
      const gate = new Promise<void>((resolve) => {
        release = resolve
      })
      const stale = repo.update({ id: record.session.id }, async (working) => {
        entered()
        await gate
        working.session.reference = 'stale'
      })
      await started
      await database.faceCheckSession.update({
        where: { id: record.session.id },
        data: { leaseExpiresAt: new Date(Date.now() - 1) },
      })
      await repo.update({ id: record.session.id }, (working) => {
        working.session.reference = 'newer'
      })
      release()
      await expect(stale).rejects.toMatchObject({ code: 'PERSISTENCE_BUSY' })
      expect((await repo.read({ id: record.session.id }))?.session.reference).toBe('newer')
    })

    it('denies finalization after a portfolio transfer and retains rejected evidence when the callback throws', async () => {
      const record = await session(agent)
      const repo = repository(agent)
      await expect(
        repo.update({ id: record.session.id }, (working) => {
          working.session.evidenceHistory.push({
            id: randomUUID(),
            step: 'front',
            challenge: null,
            attempt: 1,
            capturedAt: new Date().toISOString(),
            status: 'rejected',
            reason: 'blurry',
          })
          throw new Error('inspection refused')
        }),
      ).rejects.toThrow('inspection refused')
      expect((await repo.read({ id: record.session.id }))?.session.evidenceHistory).toHaveLength(1)
      let entered!: () => void, release!: () => void
      const started = new Promise<void>((resolve) => {
        entered = resolve
      })
      const gate = new Promise<void>((resolve) => {
        release = resolve
      })
      const updating = repo.update({ id: record.session.id }, async (working) => {
        entered()
        await gate
        working.session.reference = 'unauthorized'
      })
      await started
      await database.property.update({
        where: { id: property },
        data: { responsibleId: anotherAgent.actorId },
      })
      release()
      try {
        await expect(updating).rejects.toMatchObject({ code: 'SESSION_NOT_FOUND', status: 404 })
        expect(
          (await repository(owner).read({ id: record.session.id }))?.session.reference,
        ).toBeNull()
      } finally {
        await database.property.update({
          where: { id: property },
          data: { responsibleId: agent.actorId },
        })
      }
    })

    it('rejects approval in the final CAS when images expire after the operation starts', async () => {
      const record = await session()
      let now = Date.now()
      await database.faceCheckSession.update({
        where: { id: record.session.id },
        data: { status: 'REVIEW', evidenceExpiresAt: new Date(now + 1000) },
      })
      const repo = new PrismaSessionRepository(
        new FaceCheckAccessScope(database, { actor: owner }),
        cipher,
        () => now,
      )
      await expect(
        repo.update({ id: record.session.id }, (working) => {
          working.session.status = 'APPROVED'
          now += 2000
        }),
      ).rejects.toMatchObject({ code: 'EVIDENCE_DELETED', status: 410 })
      expect(
        (await database.faceCheckSession.findUniqueOrThrow({ where: { id: record.session.id } }))
          .status,
      ).toBe('REVIEW')
    })

    it('keeps the earliest image deadline across redo and a later review', async () => {
      const record = await session()
      const repo = repository(owner)
      const earliest = new Date(Date.now() + 48 * 60 * 60 * 1000)
      await database.faceCheckSession.update({
        where: { id: record.session.id },
        data: { evidenceExpiresAt: earliest },
      })
      await repo.update({ id: record.session.id }, (working) => {
        working.session.status = 'REVIEW'
        working.session.evidenceHistory.push({
          id: randomUUID(),
          step: 'front',
          challenge: null,
          attempt: 1,
          capturedAt: new Date().toISOString(),
          status: 'accepted',
          reason: null,
        })
      })
      await repo.update({ id: record.session.id }, (working) => {
        working.session.status = 'RESUBMISSION_REQUESTED'
      })
      await repo.update({ id: record.session.id }, (working) => {
        working.session.status = 'REVIEW'
        working.session.evidenceHistory.push({
          id: randomUUID(),
          step: 'selfie',
          challenge: null,
          attempt: 2,
          capturedAt: new Date().toISOString(),
          status: 'accepted',
          reason: null,
        })
      })
      expect(
        (await database.faceCheckSession.findUniqueOrThrow({ where: { id: record.session.id } }))
          .evidenceExpiresAt,
      ).toEqual(earliest)
    })

    it('assigns a newly issued link to the eligible responsible actor after a portfolio transfer and preserves the creator audit', async () => {
      const record = await session(agent)
      await repository(owner).update({ id: record.session.id }, (working) => {
        working.session.status = 'REJECTED'
      })
      await database.property.update({
        where: { id: property },
        data: { responsibleId: anotherAgent.actorId },
      })
      try {
        const h = verificationHarness()
        const cases = buildVerificationUseCases({
          ...h.deps,
          actorId: anotherAgent.actorId,
          sessions: repository(anotherAgent),
        })
        const reopened = await cases.reopenSessionUseCase.execute(record.session.id)
        const row = await database.faceCheckSession.findUniqueOrThrow({
          where: { id: record.session.id },
        })
        expect(row.requestedById).toBe(anotherAgent.actorId)
        expect(reopened.timeline[0].actor).toBe(agent.actorId)
        expect(reopened.timeline.at(-1)).toMatchObject({
          kind: 'reopened',
          actor: anotherAgent.actorId,
        })
        expect(
          await new PrismaSessionRepository(
            new FaceCheckAccessScope(database, { token: record.session.token }),
            cipher,
          ).read({ token: record.session.token }),
        ).toBeNull()
        expect(
          await new PrismaSessionRepository(
            new FaceCheckAccessScope(database, { token: reopened.token }),
            cipher,
          ).read({ token: reopened.token }),
        ).not.toBeNull()
      } finally {
        await database.property.update({
          where: { id: property },
          data: { responsibleId: agent.actorId },
        })
      }
    })

    it('reserves a durable retention deadline before a photo PUT, including an orphan with no evidence metadata', async () => {
      const record = await session()
      const repo = repository(owner)
      await expect(
        repo.update({ id: record.session.id }, async () => {
          await repo.prepareEvidence(record.session.id)
          const reserved = await database.faceCheckSession.findUniqueOrThrow({
            where: { id: record.session.id },
          })
          expect(reserved.evidenceExpiresAt).not.toBeNull()
          throw new Error('PUT succeeded but response was lost before metadata')
        }),
      ).rejects.toThrow('PUT succeeded')
      const row = await database.faceCheckSession.findUniqueOrThrow({
        where: { id: record.session.id },
      })
      expect(row.evidenceExpiresAt!.getTime()).toBeGreaterThan(
        Date.now() + evidenceRetentionMs - 5000,
      )
      expect((await repo.read({ id: record.session.id }))!.session.evidenceHistory).toHaveLength(0)
      await database.faceCheckSession.update({
        where: { id: record.session.id },
        data: { evidenceExpiresAt: new Date(Date.now() - 1) },
      })
      const deletePhotos = vi.fn(async () => {})
      expect(
        await new FaceCheckEvidencePurger(database, cipher, deletePhotos).execute({
          sessionId: record.session.id,
        }),
      ).toEqual({ deleted: 1, failed: 0 })
      expect(deletePhotos).toHaveBeenCalledWith(
        agency,
        record.session.id,
        expect.objectContaining({
          assertLease: expect.any(Function),
          signal: expect.any(AbortSignal),
        }),
      )
    })

    it('purges final decisions durably, blocks access immediately and retries a failed deletion without losing metadata', async () => {
      const record = await session()
      const repo = repository(owner)
      await repo.update({ id: record.session.id }, (working) => {
        working.session.status = 'REVIEW'
        working.session.signals = [
          { key: 'faceMatch', value: 0.6, threshold: null, max: 1, unit: 'score' },
        ]
        working.session.evidenceHistory.push({
          id: randomUUID(),
          step: 'front',
          challenge: null,
          attempt: 1,
          capturedAt: new Date().toISOString(),
          status: 'rejected',
          reason: 'blurry',
        })
      })
      const review = await database.faceCheckSession.findUniqueOrThrow({
        where: { id: record.session.id },
      })
      expect(review.evidenceExpiresAt!.getTime()).toBeGreaterThan(
        Date.now() + evidenceRetentionMs - 5000,
      )
      await repo.update({ id: record.session.id }, (working) => {
        working.session.status = 'REJECTED'
      })
      expect(evidenceUnavailable((await repo.read({ id: record.session.id }))!.session)).toBe(true)
      const deletePhotos = vi
        .fn()
        .mockRejectedValueOnce(new Error('storage temporarily unavailable'))
        .mockResolvedValue(undefined)
      const purger = new FaceCheckEvidencePurger(database, cipher, deletePhotos)
      expect(await purger.execute({ sessionId: record.session.id })).toEqual({
        deleted: 0,
        failed: 1,
      })
      expect(
        await database.faceCheckSession.findUnique({
          where: { id: record.session.id },
          select: {
            evidencePurgePending: true,
            evidenceDeletedAt: true,
            evidencePurgeAttempts: true,
          },
        }),
      ).toEqual({ evidencePurgePending: true, evidenceDeletedAt: null, evidencePurgeAttempts: 1 })
      expect(await purger.execute({ sessionId: record.session.id })).toEqual({
        deleted: 1,
        failed: 0,
      })
      const retained = (await repo.read({ id: record.session.id }))!.session
      expect(retained.evidenceDeletedAt).toBeTruthy()
      expect(retained.evidencePurgePending).toBe(false)
      expect(retained.evidenceHistory[0]).toMatchObject({
        status: 'rejected',
        reason: 'blurry',
        deletedAt: expect.any(String),
      })
      expect(retained.signals[0].value).toBe(0.6)
      expect(retained.timeline[0].actor).toBe(owner.actorId)
    })

    it('cleans an expired session prefix even when it never recorded a photo and does not race an active lease', async () => {
      const record = await session()
      await database.faceCheckSession.update({
        where: { id: record.session.id },
        data: { expiresAt: new Date(Date.now() - evidenceRetentionMs - 1) },
      })
      const repo = repository(owner)
      let entered!: () => void, release!: () => void
      const started = new Promise<void>((resolve) => {
        entered = resolve
      })
      const gate = new Promise<void>((resolve) => {
        release = resolve
      })
      const active = repo.update({ id: record.session.id }, async () => {
        entered()
        await gate
      })
      await started
      const deletePhotos = vi.fn(async () => {})
      const purger = new FaceCheckEvidencePurger(database, cipher, deletePhotos)
      expect(await purger.execute({ sessionId: record.session.id })).toEqual({
        deleted: 0,
        failed: 0,
      })
      expect(deletePhotos).not.toHaveBeenCalled()
      release()
      await active
      // The encrypted capture link expiry is copied back during finalization; force the fallback deadline again.
      await database.faceCheckSession.update({
        where: { id: record.session.id },
        data: { expiresAt: new Date(Date.now() - evidenceRetentionMs - 1) },
      })
      expect(await purger.execute({ sessionId: record.session.id })).toEqual({
        deleted: 1,
        failed: 0,
      })
      expect(deletePhotos).toHaveBeenCalledWith(
        agency,
        record.session.id,
        expect.objectContaining({
          assertLease: expect.any(Function),
          signal: expect.any(AbortSignal),
        }),
      )
    })
  },
)

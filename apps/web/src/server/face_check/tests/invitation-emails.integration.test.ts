import { randomBytes, randomUUID } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'
import type { AppLocale } from '@/i18n/types/locale.types'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { disposableFaceCheckDatabase } from './fixtures/disposable-database'
import { DataCipher, captureTokenHash } from '../infrastructure/data-cipher'
import { FaceCheckAccessScope } from '../infrastructure/access-scope'
import { PrismaSessionRepository } from '../infrastructure/prisma-session-repository'
import { PrismaFaceCheckInvitationRepository } from '../infrastructure/prisma-invitation-email-repository'
import { FaceCheckInvitationEmailProcessor } from '../verification/application/use-cases/invitation-emails'
import { newSessionRecord } from '../verification/domain/session-rules'
import { resolveFaceCheckActor } from '../require-face-check-actor'
import { buildCaptureUrlForLocale } from '../http/capture-url'
import type { FaceCheckActor } from '../types/access'
import type { SessionRecord } from '../types/verification.types'
import type { FaceCheckInvitationMailer } from '../types/invitation-email'

describe.skipIf(!process.env.FACE_CHECK_TEST_DATABASE_URL)(
  'FaceCheck invitation outbox persistence',
  () => {
    let database: PrismaClient
    const cipher = new DataCipher(randomBytes(32))
    const prefix = randomUUID()
    const tenants: string[] = []
    let agency: string, otherAgency: string, propertyId: string
    let owner: FaceCheckActor, agent: FaceCheckActor
    const recipient = `${prefix}-external-candidate@example.test`

    async function tenant(suffix: string) {
      const row = await database.tenant.create({
        data: { name: suffix, slug: `${prefix}-${suffix}`, accountType: 'AGENCY' },
      })
      tenants.push(row.id)
      return row.id
    }
    async function actor(role: 'OWNER' | 'AGENT') {
      const row = await database.user.create({
        data: {
          tenantId: agency,
          name: role,
          role,
          email: `${prefix}-${role}@example.test`,
          passwordHash: 'test-only',
        },
      })
      return resolveFaceCheckActor({ userId: row.id, tenantId: agency }, database)
    }
    function newRecord(contact: string | null = recipient) {
      const record = newSessionRecord(
        {
          id: randomUUID(),
          personName: 'Private Candidate',
          agencyName: 'Old agency name',
          cpf: '52998224725',
          reference: 'Private reference',
          contact,
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
      return record
    }
    async function create(
      contact: string | null = recipient,
      locale: AppLocale = 'en-US',
      issuer = owner,
    ) {
      const record = newRecord(contact)
      await new PrismaSessionRepository(
        new FaceCheckAccessScope(database, { actor: issuer }),
        cipher,
        Date.now,
        locale,
      ).insert(record)
      return record
    }
    function worker(
      send: FaceCheckInvitationMailer['send'] = vi.fn(async () => {}),
      clock = Date.now,
    ) {
      const render = vi.fn(
        (input: {
          locale: AppLocale
          personName: string
          agencyName: string
          captureUrl: string
          expiresAt: string
        }) => ({
          subject: `${input.locale} invitation`,
          text: `${input.agencyName} ${input.captureUrl}`,
          html: `<p>${input.captureUrl}</p>`,
        }),
      )
      return {
        send,
        render,
        processor: new FaceCheckInvitationEmailProcessor(
          new PrismaFaceCheckInvitationRepository(database, cipher),
          { send },
          render,
          buildCaptureUrlForLocale,
          clock,
          () => 0.5,
        ),
      }
    }
    async function queued(record: SessionRecord) {
      return database.faceCheckInvitationEmail.findUniqueOrThrow({
        where: {
          sessionId_tokenHash: {
            sessionId: record.session.id,
            tokenHash: captureTokenHash(record.session.token),
          },
        },
      })
    }

    beforeAll(async () => {
      database = disposableFaceCheckDatabase()
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://trusted.example.test')
      agency = await tenant('current-agency')
      otherAgency = await tenant('another-agency')
      owner = await actor('OWNER')
      agent = await actor('AGENT')
      propertyId = (
        await database.property.create({
          data: {
            tenantId: agency,
            responsibleId: agent.actorId,
            title: 'Private property',
            purpose: 'RENT',
            type: 'HOUSE',
            price: 1,
          },
        })
      ).id
    })
    afterAll(async () => {
      vi.unstubAllEnvs()
      if (database) {
        for (const id of tenants) await database.tenant.delete({ where: { id } })
        await database.$disconnect()
      }
    })

    it('atomically queues valid external email contacts without copying personal fields into the outbox', async () => {
      const record = await create(`  ${recipient.toUpperCase()}  `, 'es-ES')
      const job = await queued(record)
      expect(job).toMatchObject({
        tenantId: agency,
        status: 'PENDING',
        locale: 'es-ES',
        attempts: 0,
        sentAt: null,
      })
      expect(
        (await database.faceCheckSession.findUniqueOrThrow({ where: { id: record.session.id } }))
          .candidateUserId,
      ).toBeNull()
      for (const value of [
        recipient,
        record.session.token,
        record.session.personName,
        record.session.cpf!,
        record.session.reference!,
      ])
        expect(JSON.stringify(job)).not.toContain(value)
      for (const contact of [
        null,
        '+55 11 99999-9999',
        'Candidate Name',
        'person%name@example.test',
      ]) {
        const skipped = await create(contact)
        expect(
          await database.faceCheckInvitationEmail.count({
            where: { sessionId: skipped.session.id },
          }),
        ).toBe(0)
      }
      const rejected = newRecord()
      await expect(
        new PrismaSessionRepository(
          new FaceCheckAccessScope(database, { actor: owner }),
          cipher,
          Date.now,
          'unsupported' as AppLocale,
        ).insert(rejected),
      ).rejects.toThrow()
      expect(
        await database.faceCheckSession.findUnique({ where: { id: rejected.session.id } }),
      ).toBeNull()
      expect(
        await database.faceCheckInvitationEmail.count({
          where: { sessionId: rejected.session.id },
        }),
      ).toBe(0)
    })

    it('enforces one invitation per session token and the provider tenant foreign key', async () => {
      const record = await create()
      const data = {
        sessionId: record.session.id,
        tenantId: agency,
        tokenHash: captureTokenHash(record.session.token),
        locale: 'en-US',
      }
      await expect(database.faceCheckInvitationEmail.create({ data })).rejects.toMatchObject({
        code: 'P2002',
      })
      await expect(
        database.faceCheckInvitationEmail.create({
          data: { ...data, tenantId: otherAgency, tokenHash: randomBytes(32).toString('hex') },
        }),
      ).rejects.toMatchObject({ code: 'P2003' })
    })

    it('sends a localized trusted link once and excludes SENT jobs from future processing', async () => {
      const record = await create(recipient, 'es-ES')
      const h = worker()
      expect(await h.processor.execute({ sessionId: record.session.id })).toEqual({
        sent: 1,
        failed: 0,
        cancelled: 0,
      })
      expect(h.render).toHaveBeenCalledWith({
        locale: 'es-ES',
        personName: 'Private Candidate',
        agencyName: 'current-agency',
        captureUrl: `https://trusted.example.test/es/face_check/verify/${record.session.token}`,
        expiresAt: record.session.expiresAt,
      })
      expect(h.send).toHaveBeenCalledWith(expect.objectContaining({ to: recipient }), {
        signal: expect.any(AbortSignal),
      })
      expect(await queued(record)).toMatchObject({
        status: 'SENT',
        attempts: 1,
        sentAt: expect.any(Date),
        leaseId: null,
        lastErrorCode: null,
      })
      expect(await h.processor.execute({ sessionId: record.session.id })).toEqual({
        sent: 0,
        failed: 0,
        cancelled: 0,
      })
      expect(h.send).toHaveBeenCalledTimes(1)
    })

    it('allows only one concurrent worker to send a queued invitation', async () => {
      const record = await create()
      const h = worker()
      const results = await Promise.all([
        h.processor.execute({ sessionId: record.session.id }),
        h.processor.execute({ sessionId: record.session.id }),
      ])
      expect(results.reduce((total, result) => total + result.sent, 0)).toBe(1)
      expect(h.send).toHaveBeenCalledTimes(1)
      expect(await queued(record)).toMatchObject({ status: 'SENT', attempts: 1 })
    })

    it('keeps failures durable and sanitized, retries after backoff, and never alters the verification status', async () => {
      const record = await create()
      const send = vi.fn(async () => {
        throw new Error(`Sensitive SES payload ${recipient} ${record.session.token}`)
      })
      const failed = worker(send)
      expect(await failed.processor.execute({ sessionId: record.session.id })).toEqual({
        sent: 0,
        failed: 1,
        cancelled: 0,
      })
      const first = await queued(record)
      expect(first).toMatchObject({
        status: 'PENDING',
        attempts: 1,
        sentAt: null,
        lastErrorCode: 'DELIVERY_FAILED',
        leaseId: null,
      })
      expect(first.nextAttemptAt.getTime()).toBeGreaterThan(Date.now())
      expect(JSON.stringify(first)).not.toContain('Sensitive SES payload')
      expect(
        (await database.faceCheckSession.findUniqueOrThrow({ where: { id: record.session.id } }))
          .status,
      ).toBe('CREATED')
      expect(await failed.processor.execute({ sessionId: record.session.id })).toEqual({
        sent: 0,
        failed: 0,
        cancelled: 0,
      })
      await database.faceCheckInvitationEmail.update({
        where: { id: first.id },
        data: { nextAttemptAt: new Date(Date.now() - 1) },
      })
      const retry = worker()
      expect(await retry.processor.execute({ sessionId: record.session.id })).toEqual({
        sent: 1,
        failed: 0,
        cancelled: 0,
      })
      expect(await queued(record)).toMatchObject({
        status: 'SENT',
        attempts: 2,
        lastErrorCode: null,
      })
    })

    it('cancels expired, reviewed, final, rotated, corrupt and timed-out capture links without sending them', async () => {
      const cases = [
        'EXPIRED_TTL',
        'REVIEW',
        'APPROVED',
        'REJECTED',
        'ROTATED_TOKEN',
        'CORRUPT',
        'CAPTURE_DEADLINE',
        'INVALID_HASH',
      ]
      for (const reason of cases) {
        const record = await create()
        if (reason === 'EXPIRED_TTL')
          record.session.expiresAt = new Date(Date.now() - 1).toISOString()
        else if (reason === 'CAPTURE_DEADLINE') {
          record.session.status = 'IN_PROGRESS'
          record.session.captureDeadline = new Date(Date.now() - 1).toISOString()
        } else if (reason === 'ROTATED_TOKEN')
          record.session.token = randomBytes(32).toString('hex')
        else if (['REVIEW', 'APPROVED', 'REJECTED'].includes(reason))
          record.session.status = reason as 'REVIEW' | 'APPROVED' | 'REJECTED'
        await database.faceCheckSession.update({
          where: { id: record.session.id },
          data: {
            status: record.session.status,
            expiresAt: new Date(record.session.expiresAt),
            tokenHash:
              reason === 'INVALID_HASH'
                ? randomBytes(32).toString('hex')
                : captureTokenHash(record.session.token),
            encryptedRecord:
              reason === 'CORRUPT'
                ? 'invalid-ciphertext'
                : cipher.encrypt(record, `session:${agency}:${record.session.id}`),
          },
        })
        const h = worker()
        expect(await h.processor.execute({ sessionId: record.session.id }), reason).toEqual({
          sent: 0,
          failed: 0,
          cancelled: 1,
        })
        expect(h.send, reason).not.toHaveBeenCalled()
        expect(
          await database.faceCheckInvitationEmail.findFirstOrThrow({
            where: { sessionId: record.session.id },
          }),
        ).toMatchObject({ status: 'CANCELLED', lastErrorCode: 'INVITATION_NOT_ELIGIBLE' })
      }
    })

    it('refreshes issuer activity, tenant status and agent portfolio ownership before delivery', async () => {
      const revoked = await create()
      await database.user.update({ where: { id: owner.actorId }, data: { active: false } })
      try {
        const h = worker()
        expect(await h.processor.execute({ sessionId: revoked.session.id })).toEqual({
          sent: 0,
          failed: 0,
          cancelled: 1,
        })
        expect(h.send).not.toHaveBeenCalled()
      } finally {
        await database.user.update({ where: { id: owner.actorId }, data: { active: true } })
      }
      const suspended = await create()
      await database.tenant.update({ where: { id: agency }, data: { status: 'SUSPENDED' } })
      try {
        const h = worker()
        expect(await h.processor.execute({ sessionId: suspended.session.id })).toEqual({
          sent: 0,
          failed: 0,
          cancelled: 1,
        })
        expect(h.send).not.toHaveBeenCalled()
      } finally {
        await database.tenant.update({ where: { id: agency }, data: { status: 'ACTIVE' } })
      }
      const transferred = await create(recipient, 'en-US', agent)
      await database.property.update({
        where: { id: propertyId },
        data: { responsibleId: owner.actorId },
      })
      try {
        const h = worker()
        expect(await h.processor.execute({ sessionId: transferred.session.id })).toEqual({
          sent: 0,
          failed: 0,
          cancelled: 1,
        })
        expect(h.send).not.toHaveBeenCalled()
      } finally {
        await database.property.update({
          where: { id: propertyId },
          data: { responsibleId: agent.actorId },
        })
      }
    })

    it('cancels delivery to a linked candidate whose email changed or whose account is no longer active and verified', async () => {
      const unchangedEmail = `${prefix}-linked@example.test`
      const unchanged = await database.user.create({
        data: {
          tenantId: otherAgency,
          role: 'RENTER',
          name: 'Linked candidate',
          email: unchangedEmail.toUpperCase(),
          passwordHash: 'test-only',
        },
      })
      const valid = await create(unchangedEmail)
      expect(
        (await database.faceCheckSession.findUniqueOrThrow({ where: { id: valid.session.id } }))
          .candidateUserId,
      ).toBe(unchanged.id)
      expect(await worker().processor.execute({ sessionId: valid.session.id })).toEqual({
        sent: 1,
        failed: 0,
        cancelled: 0,
      })
      for (const reason of ['changed-email', 'inactive', 'unverified']) {
        const email = `${prefix}-${reason}@example.test`
        const candidate = await database.user.create({
          data: {
            tenantId: otherAgency,
            role: 'RENTER',
            name: 'Candidate fixture',
            email,
            passwordHash: 'test-only',
          },
        })
        const record = await create(email)
        expect(
          (await database.faceCheckSession.findUniqueOrThrow({ where: { id: record.session.id } }))
            .candidateUserId,
        ).toBe(candidate.id)
        await database.user.update({
          where: { id: candidate.id },
          data:
            reason === 'changed-email'
              ? { email: `${prefix}-new-address@example.test` }
              : reason === 'inactive'
                ? { active: false }
                : { emailVerifiedAt: null },
        })
        const h = worker()
        expect(await h.processor.execute({ sessionId: record.session.id }), reason).toEqual({
          sent: 0,
          failed: 0,
          cancelled: 1,
        })
        expect(h.send, reason).not.toHaveBeenCalled()
        expect(await queued(record)).toMatchObject({
          status: 'CANCELLED',
          lastErrorCode: 'INVITATION_NOT_ELIGIBLE',
        })
      }
    })

    it('recovers an expired sending lease and prevents the previous owner from finalizing it', async () => {
      const record = await create()
      const row = await queued(record)
      const oldLease = randomUUID()
      await database.faceCheckInvitationEmail.update({
        where: { id: row.id },
        data: {
          status: 'SENDING',
          attempts: 1,
          leaseId: oldLease,
          leaseExpiresAt: new Date(Date.now() - 1),
        },
      })
      const repo = new PrismaFaceCheckInvitationRepository(database, cipher)
      const [job] = await repo.due({ sessionId: record.session.id, limit: 1 }, new Date())
      const h = worker()
      expect(await h.processor.execute({ sessionId: record.session.id })).toEqual({
        sent: 1,
        failed: 0,
        cancelled: 0,
      })
      expect(await repo.complete(job, oldLease, new Date())).toBe(false)
      expect(await queued(record)).toMatchObject({ status: 'SENT', attempts: 2, leaseId: null })
    })
  },
)

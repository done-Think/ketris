import { randomBytes, randomUUID } from 'node:crypto'
import type { PrismaClient, TenantAccountType, UserRole } from '@prisma/client'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { disposableFaceCheckDatabase } from './fixtures/disposable-database'
import { DataCipher, captureTokenHash } from '../infrastructure/data-cipher'
import { FaceCheckAccessScope } from '../infrastructure/access-scope'
import { PrismaSessionRepository } from '../infrastructure/prisma-session-repository'
import { PrismaCandidateVerificationRepository } from '../infrastructure/prisma-candidate-verification-repository'
import { resolveFaceCheckActor } from '../require-face-check-actor'
import { resolveFaceCheckCandidate } from '../require-face-check-candidate'
import { newSessionRecord } from '../verification/domain/session-rules'
import {
  GetFaceCheckAccessUseCase,
  GetMyFaceCheckVerificationCountsUseCase,
  ListMyFaceCheckVerificationsUseCase,
} from '../verification/application/use-cases/candidate-verifications'
import { buildCaptureUrl } from '../http/capture-url'
import type { FaceCheckActor } from '../types/access'
import type { FaceCheckCandidate } from '../types/candidate'

describe.skipIf(!process.env.FACE_CHECK_TEST_DATABASE_URL)(
  'FaceCheck explicit candidate associations',
  () => {
    let database: PrismaClient
    const cipher = new DataCipher(randomBytes(32))
    const prefix = randomUUID()
    const tenants: string[] = []
    let agency: string, anotherAgency: string, personal: string, anotherPersonal: string
    let owner: FaceCheckActor, otherOwner: FaceCheckActor
    let propertyId: string, otherPropertyId: string
    let candidate: FaceCheckCandidate, otherCandidate: FaceCheckCandidate
    const email = `${prefix}-candidate@example.test`
    const otherEmail = `${prefix}-other@example.test`

    async function tenant(name: string, accountType: TenantAccountType) {
      const row = await database.tenant.create({
        data: { name, slug: `${prefix}-${name}`, accountType },
        select: { id: true },
      })
      tenants.push(row.id)
      return row.id
    }

    async function user(
      tenantId: string,
      email: string,
      role: UserRole = 'RENTER',
      extra: {
        active?: boolean
        emailVerifiedAt?: Date | null
        membershipApprovedAt?: Date | null
      } = {},
    ) {
      return database.user.create({
        data: {
          tenantId,
          email,
          name: 'Candidate fixture',
          role,
          passwordHash: 'test-only',
          ...extra,
        },
        select: { id: true, tenantId: true },
      })
    }

    async function createSession(contact: string, issuer = owner, property = propertyId) {
      const record = newSessionRecord(
        {
          id: randomUUID(),
          personName: 'Private Candidate Name',
          agencyName: 'Private Agency',
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
      record.session.propertyId = property
      await new PrismaSessionRepository(
        new FaceCheckAccessScope(database, { actor: issuer }),
        cipher,
      ).insert(record)
      return record
    }

    function reader() {
      return new PrismaCandidateVerificationRepository(database, cipher)
    }

    beforeAll(async () => {
      database = disposableFaceCheckDatabase()
      agency = await tenant('provider-agency', 'AGENCY')
      anotherAgency = await tenant('other-provider', 'AGENCY')
      personal = await tenant('personal', 'INDIVIDUAL')
      anotherPersonal = await tenant('other-personal', 'INDIVIDUAL')
      const firstOwner = await user(agency, `${prefix}-owner@example.test`, 'OWNER')
      const secondOwner = await user(anotherAgency, `${prefix}-second-owner@example.test`, 'OWNER')
      owner = await resolveFaceCheckActor({ userId: firstOwner.id, tenantId: agency }, database)
      otherOwner = await resolveFaceCheckActor(
        { userId: secondOwner.id, tenantId: anotherAgency },
        database,
      )
      const firstCandidate = await user(personal, email)
      const secondCandidate = await user(anotherPersonal, otherEmail)
      candidate = await resolveFaceCheckCandidate(
        { userId: firstCandidate.id, tenantId: personal },
        database,
      )
      otherCandidate = await resolveFaceCheckCandidate(
        { userId: secondCandidate.id, tenantId: anotherPersonal },
        database,
      )
      propertyId = (
        await database.property.create({
          data: {
            tenantId: agency,
            responsibleId: owner.actorId,
            title: 'Candidate property',
            purpose: 'RENT',
            type: 'HOUSE',
            price: 1,
          },
          select: { id: true },
        })
      ).id
      otherPropertyId = (
        await database.property.create({
          data: {
            tenantId: anotherAgency,
            responsibleId: otherOwner.actorId,
            title: 'Another property',
            purpose: 'RENT',
            type: 'HOUSE',
            price: 1,
          },
          select: { id: true },
        })
      ).id
    })

    afterAll(async () => {
      vi.unstubAllEnvs()
      if (database) {
        for (const tenantId of tenants) await database.tenant.delete({ where: { id: tenantId } })
        await database.$disconnect()
      }
    })

    it('links a unique verified personal account across tenants and exposes only its own minimal verification metadata', async () => {
      const own = await createSession(`  ${email.toUpperCase()}  `)
      const unrelated = await createSession(otherEmail, otherOwner, otherPropertyId)
      expect(
        (await database.faceCheckSession.findUniqueOrThrow({ where: { id: own.session.id } }))
          .candidateUserId,
      ).toBe(candidate.userId)
      const rows = await reader().list(candidate)
      expect(rows.map((row) => row.id)).toContain(own.session.id)
      expect(rows.map((row) => row.id)).not.toContain(unrelated.session.id)
      expect((await reader().list(otherCandidate)).map((row) => row.id)).toContain(
        unrelated.session.id,
      )
      expect((await reader().list(otherCandidate)).map((row) => row.id)).not.toContain(
        own.session.id,
      )
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.test')
      const result = await new ListMyFaceCheckVerificationsUseCase(reader()).execute(
        candidate,
        (token) =>
          buildCaptureUrl(
            new Request('https://app.example.test/api', {
              headers: { 'Accept-Language': 'en-US' },
            }),
            token,
          ),
      )
      const item = result.items.find((row) => row.id === own.session.id)!
      expect(item).toEqual({
        id: own.session.id,
        propertyTitle: 'Candidate property',
        agencyName: 'provider-agency',
        status: 'CREATED',
        createdAt: expect.any(String),
        expiresAt: expect.any(String),
        captureUrl: `https://app.example.test/en/face_check/verify/${own.session.token}`,
      })
      expect(JSON.stringify(result)).not.toMatch(
        /52998224725|Private Candidate Name|Private reference|evidenceHistory|timeline|encryptedRecord|captureToken|candidateUserId/,
      )
    })

    it('prefers the unique same-tenant account when the same verified email exists in other tenants', async () => {
      const duplicateEmail = `${prefix}-preferred@example.test`
      const local = await user(agency, duplicateEmail)
      await user(personal, duplicateEmail)
      await user(anotherPersonal, duplicateEmail)
      const record = await createSession(duplicateEmail)
      expect(
        (await database.faceCheckSession.findUniqueOrThrow({ where: { id: record.session.id } }))
          .candidateUserId,
      ).toBe(local.id)
    })

    it('reads individual captures only for their associated candidate within the same tenant or across provider tenants', async () => {
      const own = await createSession(email)
      const anotherProvider = await createSession(email, otherOwner, otherPropertyId)
      const unrelated = await createSession(otherEmail)
      const localEmail = `${prefix}-local-capture@example.test`
      const localUser = await user(agency, localEmail)
      const local = await resolveFaceCheckCandidate(
        { userId: localUser.id, tenantId: agency },
        database,
      )
      const localRecord = await createSession(localEmail)
      const neighborUser = await user(personal, `${prefix}-neighbor-capture@example.test`)
      const neighbor = await resolveFaceCheckCandidate(
        { userId: neighborUser.id, tenantId: personal },
        database,
      )
      const repository = reader()
      for (const record of [own, anotherProvider]) {
        expect(await repository.capture(candidate, record.session.id)).toEqual({
          id: record.session.id,
          captureToken: record.session.token,
        })
        expect(await repository.findByToken(candidate, record.session.token)).toEqual({
          id: record.session.id,
        })
        for (const other of [otherCandidate, neighbor, local]) {
          expect(await repository.capture(other, record.session.id)).toBeNull()
          expect(await repository.findByToken(other, record.session.token)).toBeNull()
        }
      }
      expect(await repository.capture(local, localRecord.session.id)).toEqual({
        id: localRecord.session.id,
        captureToken: localRecord.session.token,
      })
      expect(await repository.findByToken(local, localRecord.session.token)).toEqual({
        id: localRecord.session.id,
      })
      for (const id of [unrelated.session.id, localRecord.session.id, randomUUID()])
        expect(await repository.capture(candidate, id)).toBeNull()
      for (const token of [
        unrelated.session.token,
        localRecord.session.token,
        randomBytes(32).toString('hex'),
        `${own.session.token.slice(0, 63)}%`,
        `${own.session.token.slice(0, 63)}_`,
      ])
        expect(await repository.findByToken(candidate, token)).toBeNull()
    })

    it('keeps individual metadata ownership while withholding expired, reviewed, final, corrupt or mismatched capture tokens', async () => {
      const repository = reader()
      for (const reason of [
        'TTL',
        'DEADLINE',
        'REVIEW',
        'APPROVED',
        'REJECTED',
        'CORRUPT',
        'HASH',
      ]) {
        const record = await createSession(email)
        if (reason === 'TTL') record.session.expiresAt = new Date(Date.now() - 1).toISOString()
        if (reason === 'DEADLINE') {
          record.session.status = 'IN_PROGRESS'
          record.session.captureDeadline = new Date(Date.now() - 1).toISOString()
        }
        if (reason === 'REVIEW' || reason === 'APPROVED' || reason === 'REJECTED')
          record.session.status = reason
        await database.faceCheckSession.update({
          where: { id: record.session.id },
          data: {
            status: record.session.status,
            expiresAt: new Date(record.session.expiresAt),
            encryptedRecord:
              reason === 'CORRUPT'
                ? 'invalid-ciphertext'
                : cipher.encrypt(record, `session:${agency}:${record.session.id}`),
            ...(reason === 'HASH'
              ? { tokenHash: captureTokenHash(randomBytes(32).toString('hex')) }
              : {}),
          },
        })
        expect(await repository.capture(candidate, record.session.id), reason).toEqual({
          id: record.session.id,
          captureToken: null,
        })
        expect(await repository.findByToken(candidate, record.session.token), reason).toEqual(
          reason === 'HASH' ? null : { id: record.session.id },
        )
      }
      const revokedIssuer = await createSession(email)
      await database.user.update({ where: { id: owner.actorId }, data: { active: false } })
      try {
        expect(await repository.capture(candidate, revokedIssuer.session.id)).toEqual({
          id: revokedIssuer.session.id,
          captureToken: null,
        })
        expect(await repository.findByToken(candidate, revokedIssuer.session.token)).toEqual({
          id: revokedIssuer.session.id,
        })
      } finally {
        await database.user.update({ where: { id: owner.actorId }, data: { active: true } })
      }
    })

    it('does not link ambiguous global accounts, unverified/inactive users or unmatched email addresses', async () => {
      const ambiguous = `${prefix}-ambiguous@example.test`
      await user(personal, ambiguous)
      await user(anotherPersonal, ambiguous)
      const unverified = `${prefix}-unverified@example.test`
      await user(personal, unverified, 'RENTER', { emailVerifiedAt: null })
      const inactive = `${prefix}-inactive@example.test`
      await user(personal, inactive, 'RENTER', { active: false })
      for (const contact of [ambiguous, unverified, inactive, `${prefix}-no-match@example.test`]) {
        const record = await createSession(contact)
        expect(
          (await database.faceCheckSession.findUniqueOrThrow({ where: { id: record.session.id } }))
            .candidateUserId,
        ).toBeNull()
        expect((await reader().list(candidate)).map((row) => row.id)).not.toContain(
          record.session.id,
        )
      }
    })

    it('rejects creation with a name or phone instead of the required invitation email', async () => {
      const count = await database.faceCheckSession.count({ where: { tenantId: agency } })
      for (const contact of ['', 'Candidate fixture', '+55 11 99999-9999'])
        await expect(createSession(contact)).rejects.toThrow()
      expect(await database.faceCheckSession.count({ where: { tenantId: agency } })).toBe(count)
    })

    it('matches literal underscores even with wildcard lookalikes and never associates a non-equal pattern', async () => {
      const exactEmail = `${prefix}-underscore_literal@example.test`
      await user(personal, `${prefix}-underscoreXliteral@example.test`)
      const exact = await user(personal, exactEmail)
      const literal = await createSession(exactEmail.toUpperCase())
      expect(
        (await database.faceCheckSession.findUniqueOrThrow({ where: { id: literal.session.id } }))
          .candidateUserId,
      ).toBe(exact.id)
      const unmatchedEmail = `${prefix}-underscore_unowned@example.test`
      await user(personal, `${prefix}-underscoreXunowned@example.test`)
      const pattern = await createSession(unmatchedEmail)
      expect(
        (await database.faceCheckSession.findUniqueOrThrow({ where: { id: pattern.session.id } }))
          .candidateUserId,
      ).toBeNull()
    })

    it('rejects creation with a contact rejected by the application email validator', async () => {
      const invalidEmail = `${prefix}-percent%literal@example.test`
      await user(personal, invalidEmail)
      await user(personal, `${prefix}-percentExpandedliteral@example.test`)
      await expect(createSession(invalidEmail)).rejects.toThrow()
    })

    it('keeps candidate access separate from the provider console and counts without decrypting any session', async () => {
      await createSession(email)
      await expect(
        resolveFaceCheckActor({ userId: candidate.userId, tenantId: candidate.tenantId }, database),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
      const decrypt = vi.spyOn(DataCipher.prototype, 'decrypt').mockImplementation(() => {
        throw new Error('count must not decrypt')
      })
      try {
        expect(await reader().count(candidate)).toBeGreaterThan(0)
        expect(await new GetFaceCheckAccessUseCase(reader()).execute(candidate)).toMatchObject({
          allowed: false,
          candidateVerifications: true,
          role: 'RENTER',
          accountType: 'INDIVIDUAL',
        })
        expect(decrypt).not.toHaveBeenCalled()
      } finally {
        decrypt.mockRestore()
      }
    })

    it('does not return links after expiry, a final decision, issuer revocation or a portfolio transfer', async () => {
      const expired = await createSession(email)
      await database.faceCheckSession.update({
        where: { id: expired.session.id },
        data: { expiresAt: new Date(Date.now() - 1) },
      })
      const final = await createSession(email)
      await new PrismaSessionRepository(
        new FaceCheckAccessScope(database, { actor: owner }),
        cipher,
      ).update({ id: final.session.id }, (working) => {
        working.session.status = 'REJECTED'
      })
      const revoked = await createSession(email)
      await database.user.update({ where: { id: owner.actorId }, data: { active: false } })
      try {
        expect(
          (await reader().list(candidate)).find((row) => row.id === revoked.session.id)!
            .captureToken,
        ).toBeNull()
      } finally {
        await database.user.update({ where: { id: owner.actorId }, data: { active: true } })
      }
      const issuer = await user(agency, `${prefix}-agent@example.test`, 'AGENT')
      const actor = await resolveFaceCheckActor({ userId: issuer.id, tenantId: agency }, database)
      await database.property.update({
        where: { id: propertyId },
        data: { responsibleId: issuer.id },
      })
      const transferred = await createSession(email, actor)
      await database.property.update({
        where: { id: propertyId },
        data: { responsibleId: owner.actorId },
      })
      const items = await reader().list(candidate)
      expect(items.find((row) => row.id === expired.session.id)).toMatchObject({
        status: 'EXPIRED',
        captureToken: null,
      })
      expect(
        (await database.faceCheckSession.findUniqueOrThrow({ where: { id: expired.session.id } }))
          .status,
      ).toBe('CREATED')
      for (const id of [expired.session.id, final.session.id, transferred.session.id])
        expect(items.find((row) => row.id === id)!.captureToken).toBeNull()
    })

    it('counts only live and intact own capture links as pending without exposing any session data', async () => {
      const notificationEmail = `${prefix}-notifications@example.test`
      const account = await user(personal, notificationEmail)
      const notificationCandidate = await resolveFaceCheckCandidate(
        { userId: account.id, tenantId: personal },
        database,
      )
      const counts = () =>
        new GetMyFaceCheckVerificationCountsUseCase(reader()).execute(notificationCandidate)
      expect(await counts()).toEqual({ count: 0, pendingCount: 0 })
      const valid = await createSession(notificationEmail)
      const repository = new PrismaSessionRepository(
        new FaceCheckAccessScope(database, { actor: owner }),
        cipher,
      )
      const expired = await createSession(notificationEmail)
      await repository.update({ id: expired.session.id }, (record) => {
        record.session.expiresAt = new Date(Date.now() - 1).toISOString()
      })
      const deadline = await createSession(notificationEmail)
      await repository.update({ id: deadline.session.id }, (record) => {
        record.session.status = 'IN_PROGRESS'
        record.session.captureDeadline = new Date(Date.now() - 1).toISOString()
      })
      const final = await createSession(notificationEmail)
      await repository.update({ id: final.session.id }, (record) => {
        record.session.status = 'REJECTED'
      })
      const corrupt = await createSession(notificationEmail)
      await database.faceCheckSession.update({
        where: { id: corrupt.session.id },
        data: { encryptedRecord: 'invalid-ciphertext' },
      })
      const mismatchedToken = await createSession(notificationEmail)
      await database.faceCheckSession.update({
        where: { id: mismatchedToken.session.id },
        data: { tokenHash: randomBytes(32).toString('hex') },
      })
      const agent = await user(agency, `${prefix}-notification-agent@example.test`, 'AGENT')
      const actor = await resolveFaceCheckActor({ userId: agent.id, tenantId: agency }, database)
      await database.property.update({
        where: { id: propertyId },
        data: { responsibleId: actor.actorId },
      })
      try {
        await createSession(notificationEmail, actor)
      } finally {
        await database.property.update({
          where: { id: propertyId },
          data: { responsibleId: owner.actorId },
        })
      }
      await createSession(otherEmail, otherOwner, otherPropertyId)
      const result = await counts()
      expect(result).toEqual({ count: 7, pendingCount: 1 })
      expect(JSON.stringify(result)).not.toMatch(
        new RegExp(
          `${valid.session.token}|${valid.session.id}|${notificationEmail}|captureToken|captureUrl|propertyTitle|agencyName`,
        ),
      )
      await database.user.update({ where: { id: owner.actorId }, data: { active: false } })
      try {
        expect(await counts()).toEqual({ count: 7, pendingCount: 0 })
      } finally {
        await database.user.update({ where: { id: owner.actorId }, data: { active: true } })
      }
    })

    it('refreshes the candidate identity and rejects tenant substitution, revoked membership and unverified accounts', async () => {
      await expect(
        resolveFaceCheckCandidate(
          { userId: candidate.userId, tenantId: anotherPersonal },
          database,
        ),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
      await expect(
        reader().count({ ...candidate, userId: otherCandidate.userId }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
      await database.user.update({
        where: { id: candidate.userId },
        data: { membershipApprovedAt: null },
      })
      try {
        await expect(reader().list(candidate)).rejects.toMatchObject({ code: 'FORBIDDEN' })
        await expect(reader().capture(candidate, randomUUID())).rejects.toMatchObject({
          code: 'FORBIDDEN',
        })
        await expect(
          reader().findByToken(candidate, randomBytes(32).toString('hex')),
        ).rejects.toMatchObject({ code: 'FORBIDDEN' })
      } finally {
        await database.user.update({
          where: { id: candidate.userId },
          data: { membershipApprovedAt: new Date() },
        })
      }
      const unverified = await user(personal, `${prefix}-auth-unverified@example.test`, 'RENTER', {
        emailVerifiedAt: null,
      })
      await expect(
        resolveFaceCheckCandidate({ userId: unverified.id, tenantId: personal }, database),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })

    it('sets only the optional candidate reference to null when the candidate account is deleted', async () => {
      const removableEmail = `${prefix}-removable@example.test`
      const removable = await user(personal, removableEmail)
      const record = await createSession(removableEmail)
      await database.user.delete({ where: { id: removable.id } })
      const retained = await database.faceCheckSession.findUniqueOrThrow({
        where: { id: record.session.id },
      })
      expect(retained.candidateUserId).toBeNull()
      expect(retained.requestedById).toBe(owner.actorId)
      expect(retained.tenantId).toBe(agency)
    })
  },
)

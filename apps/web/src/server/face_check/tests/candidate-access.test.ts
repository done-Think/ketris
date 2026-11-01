// @vitest-environment node
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FaceCheckDatabase } from '../types/access'
import type {
  FaceCheckCandidate,
  FaceCheckCandidateVerificationRepository,
} from '../types/candidate'
import { PrismaFaceCheckCandidateLookup } from '../infrastructure/prisma-candidate-lookup'
import { PrismaCandidateVerificationRepository } from '../infrastructure/prisma-candidate-verification-repository'
import { DataCipher, captureTokenHash } from '../infrastructure/data-cipher'
import { newSessionRecord } from '../verification/domain/session-rules'
import { candidateVerificationCountsSchema } from '../schemas/api.schemas'
import {
  GetFaceCheckAccessUseCase,
  GetMyFaceCheckVerificationCountsUseCase,
  ListMyFaceCheckVerificationsUseCase,
} from '../verification/application/use-cases/candidate-verifications'

const mocks = vi.hoisted(() => ({ user: vi.fn(), token: vi.fn(), session: vi.fn() }))
vi.mock('@server/db/prisma', () => ({ prisma: { user: { findFirst: mocks.user } } }))
vi.mock('@server/auth/container', () => ({ authContainer: { tokenService: {} } }))
vi.mock('@server/auth/require-bearer-auth', () => ({ requireBearerAuth: mocks.token }))
vi.mock('@shared/lib/auth/auth-options', () => ({ authOptions: {} }))
vi.mock('next-auth', () => ({ getServerSession: mocks.session }))

import { requireFaceCheckCandidate } from '../require-face-check-candidate'
import { requireFaceCheckActor } from '../require-face-check-actor'

const candidate: FaceCheckCandidate = {
  userId: 'candidate-user',
  tenantId: 'personal-tenant',
  role: 'RENTER',
  accountType: 'INDIVIDUAL',
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.token.mockResolvedValue({
    sub: candidate.userId,
    tenantId: candidate.tenantId,
    role: 'RENTER',
  })
})

describe('FaceCheck candidate identity and permissions', () => {
  it('accepts a fresh verified renter identity while keeping every manager grant closed', async () => {
    mocks.user.mockImplementation(async ({ where }: { where: { role?: unknown } }) =>
      where.role
        ? null
        : {
            id: candidate.userId,
            tenantId: candidate.tenantId,
            role: 'RENTER',
            tenant: { accountType: 'INDIVIDUAL' },
          },
    )
    const request = new NextRequest(
      'https://app.test/api/face_check/my-verifications?candidateUserId=other&tenantId=other',
      { headers: { authorization: 'Bearer signed' } },
    )
    expect(await requireFaceCheckCandidate(request)).toEqual(candidate)
    await expect(requireFaceCheckActor(request)).rejects.toMatchObject({
      code: 'FORBIDDEN',
      status: 403,
    })
    expect(mocks.user).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: candidate.userId,
          tenantId: candidate.tenantId,
          active: true,
          emailVerifiedAt: { not: null },
          membershipApprovedAt: { not: null },
          tenant: { status: { in: ['ACTIVE', 'TRIAL'] } },
        }),
      }),
    )
  })

  it('rejects revoked or platform identities before listing any candidate data', async () => {
    mocks.user.mockResolvedValue(null)
    await expect(
      requireFaceCheckCandidate(
        new NextRequest('https://app.test/api', { headers: { authorization: 'Bearer signed' } }),
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    mocks.session.mockResolvedValue({
      scope: 'platform',
      user: { id: 'platform' },
      tenantId: 'personal',
    })
    await expect(
      requireFaceCheckCandidate(new NextRequest('https://app.test/api')),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('returns candidate availability to non-managers using count without reading encrypted sessions', async () => {
    const repository: FaceCheckCandidateVerificationRepository = {
      count: vi.fn(async () => 2),
      list: vi.fn(async () => {
        throw new Error('must not decrypt')
      }),
    }
    expect(await new GetFaceCheckAccessUseCase(repository).execute(candidate)).toEqual({
      allowed: false,
      candidateVerifications: true,
      role: 'RENTER',
      accountType: 'INDIVIDUAL',
    })
    expect(repository.list).not.toHaveBeenCalled()
    expect(
      (await new GetFaceCheckAccessUseCase(repository).execute({ ...candidate, role: 'OWNER' }))
        .allowed,
    ).toBe(false)
    expect(
      (
        await new GetFaceCheckAccessUseCase(repository).execute({
          ...candidate,
          role: 'OWNER',
          accountType: 'AGENCY',
        })
      ).allowed,
    ).toBe(true)
  })

  it('projects only the minimal self-service DTO even if a repository object has sensitive extra fields', async () => {
    const row = {
      id: 'session',
      propertyTitle: 'Property',
      agencyName: 'Agency',
      status: 'CREATED' as const,
      createdAt: '2026-10-31T12:00:00.000Z',
      expiresAt: '2026-11-01T12:00:00.000Z',
      captureToken: 'token',
      cpf: 'private-cpf',
      evidenceHistory: ['private-image'],
      timeline: ['private-audit'],
      encryptedRecord: 'private-ciphertext',
    }
    const repository: FaceCheckCandidateVerificationRepository = {
      count: async () => 1,
      list: async () => [row, { ...row, id: 'closed', captureToken: null, status: 'APPROVED' }],
    }
    const link = vi.fn((token) => `https://app.test/pt/face_check/verify/${token}`)
    const result = await new ListMyFaceCheckVerificationsUseCase(repository).execute(
      candidate,
      link,
    )
    expect(Object.keys(result.items[0]).sort()).toEqual(
      [
        'id',
        'propertyTitle',
        'agencyName',
        'status',
        'createdAt',
        'expiresAt',
        'captureUrl',
      ].sort(),
    )
    expect(JSON.stringify(result)).not.toMatch(
      /private-|captureToken|evidenceHistory|timeline|encryptedRecord/,
    )
    expect(result.items[1].captureUrl).toBeNull()
    expect(link).toHaveBeenCalledTimes(1)
  })

  it('counts all associated sessions but marks only repository-validated capture links as pending', async () => {
    const row = {
      id: 'session',
      propertyTitle: 'Private property',
      agencyName: 'Private agency',
      status: 'CREATED' as const,
      createdAt: '2026-10-31T12:00:00.000Z',
      expiresAt: '2026-11-01T12:00:00.000Z',
      captureToken: 'private-capture-token',
    }
    const repository: FaceCheckCandidateVerificationRepository = {
      count: vi.fn(async () => 99),
      list: vi.fn(async () => [
        row,
        { ...row, id: 'expired', status: 'EXPIRED' as const, captureToken: null },
        { ...row, id: 'revoked', captureToken: null },
        { ...row, id: 'corrupt', captureToken: null },
        { ...row, id: 'closed', status: 'APPROVED' as const, captureToken: null },
      ]),
    }
    const result = await new GetMyFaceCheckVerificationCountsUseCase(repository).execute(candidate)
    expect(result).toEqual({ count: 5, pendingCount: 1 })
    expect(repository.list).toHaveBeenCalledWith(candidate)
    expect(repository.count).not.toHaveBeenCalled()
    expect(candidateVerificationCountsSchema.parse(result)).toEqual(result)
    expect(
      candidateVerificationCountsSchema.safeParse({ ...result, captureToken: row.captureToken })
        .success,
    ).toBe(false)
    expect(JSON.stringify(result)).not.toMatch(/Private|captureToken|private-capture-token/)
  })

  it('returns zero counts when no verification is explicitly associated with the candidate', async () => {
    const repository: FaceCheckCandidateVerificationRepository = {
      count: vi.fn(async () => 0),
      list: vi.fn(async () => []),
    }
    expect(
      await new GetMyFaceCheckVerificationCountsUseCase(repository).execute(candidate),
    ).toEqual({
      count: 0,
      pendingCount: 0,
    })
  })
})

describe('FaceCheck single candidate verification reads', () => {
  function captureReader() {
    const now = Date.parse('2030-01-01T12:00:00.000Z')
    const cipher = new DataCipher(Buffer.alloc(32, 7))
    const record = newSessionRecord(
      {
        id: 'own-session',
        personName: 'Private candidate',
        agencyName: 'Agency',
        cpf: null,
        reference: null,
        contact: null,
        acceptedDocument: 'RG',
        createdAt: now,
        expiresAt: now + 60_000,
        outcome: 'approve',
        token: 'a'.repeat(64),
        captureMode: 'camera',
        maxAttempts: 3,
      },
      'event',
    )
    record.session.propertyId = 'property'
    const row = {
      id: record.session.id,
      tenantId: 'provider-tenant',
      propertyId: 'property',
      requestedById: 'owner',
      status: record.session.status,
      createdAt: new Date(now),
      expiresAt: new Date(record.session.expiresAt),
      tokenHash: captureTokenHash(record.session.token),
      encryptedRecord: cipher.encrypt(record, 'session:provider-tenant:own-session'),
      property: { title: 'Private property', tenantId: 'provider-tenant', responsibleId: 'owner' },
      tenant: { name: 'Provider', status: 'ACTIVE', accountType: 'AGENCY' },
      requestedBy: {
        id: 'owner',
        tenantId: 'provider-tenant',
        role: 'OWNER',
        active: true,
        emailVerifiedAt: new Date(now),
        membershipApprovedAt: new Date(now),
      },
    }
    const user = vi.fn(async ({ where }: { where: { id: string; tenantId: string } }) =>
      where.id === candidate.userId && where.tenantId === candidate.tenantId
        ? {
            id: candidate.userId,
            tenantId: candidate.tenantId,
            role: candidate.role,
            tenant: { accountType: candidate.accountType },
          }
        : null,
    )
    const findFirst = vi.fn(async (): Promise<typeof row | null> => row)
    const count = vi.fn(),
      findMany = vi.fn()
    const database = {
      user: { findFirst: user },
      faceCheckSession: { findFirst, count, findMany },
    } as unknown as FaceCheckDatabase
    return {
      now,
      cipher,
      record,
      row,
      user,
      findFirst,
      count,
      findMany,
      reader: new PrismaCandidateVerificationRepository(database, cipher, () => now),
    }
  }

  it('reads one owned session by ID with a fresh candidate grant and no collection scan', async () => {
    const h = captureReader()
    expect(await h.reader.capture(candidate, h.row.id)).toEqual({
      id: h.row.id,
      captureToken: h.record.session.token,
    })
    expect(h.findFirst).toHaveBeenCalledWith({
      where: {
        id: h.row.id,
        candidateUserId: candidate.userId,
        candidateUser: {
          id: candidate.userId,
          tenantId: candidate.tenantId,
          active: true,
          emailVerifiedAt: { not: null },
          membershipApprovedAt: { not: null },
          tenant: { status: { in: ['ACTIVE', 'TRIAL'] } },
        },
      },
      select: expect.objectContaining({ id: true, encryptedRecord: true }),
    })
    expect(h.user).toHaveBeenCalledTimes(1)
    expect(h.count).not.toHaveBeenCalled()
    expect(h.findMany).not.toHaveBeenCalled()
  })

  it('looks up only the owned literal token hash and projects an ID without decrypting payloads', async () => {
    const h = captureReader()
    const decrypt = vi.spyOn(h.cipher, 'decrypt')
    expect(await h.reader.findByToken(candidate, h.record.session.token)).toEqual({ id: h.row.id })
    expect(h.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        candidateUserId: candidate.userId,
        tokenHash: captureTokenHash(h.record.session.token),
      }),
      select: { id: true },
    })
    expect(JSON.stringify(h.findFirst.mock.calls)).not.toContain(h.record.session.token)
    expect(decrypt).not.toHaveBeenCalled()
    expect(h.count).not.toHaveBeenCalled()
    expect(h.findMany).not.toHaveBeenCalled()
  })

  it('returns null for an unknown or unrelated verification', async () => {
    const h = captureReader()
    h.findFirst.mockResolvedValue(null)
    expect(await h.reader.capture(candidate, 'unknown')).toBeNull()
    expect(await h.reader.findByToken(candidate, 'b'.repeat(64))).toBeNull()
  })

  it.each(['a'.repeat(63) + '%', 'a'.repeat(63) + '_', 'A'.repeat(64), 'unknown'])(
    'rejects a nonliteral capture token %s without a session read',
    async (token) => {
      const h = captureReader()
      expect(await h.reader.findByToken(candidate, token)).toBeNull()
      expect(h.user).toHaveBeenCalledTimes(1)
      expect(h.findFirst).not.toHaveBeenCalled()
    },
  )

  it.each(['REVIEW', 'APPROVED', 'REJECTED'] as const)(
    'keeps an owned %s page discoverable without returning its token',
    async (status) => {
      const h = captureReader()
      h.row.status = status
      expect(await h.reader.capture(candidate, h.row.id)).toEqual({
        id: h.row.id,
        captureToken: null,
      })
      expect(await h.reader.findByToken(candidate, h.record.session.token)).toEqual({
        id: h.row.id,
      })
    },
  )

  it('returns no capture token after TTL expiry, issuer revocation, payload corruption or hash mismatch', async () => {
    for (const reason of ['expiry', 'issuer', 'corrupt', 'hash']) {
      const h = captureReader()
      if (reason === 'expiry') h.row.expiresAt = new Date(h.now - 1)
      if (reason === 'issuer') h.row.requestedBy.active = false
      if (reason === 'corrupt') h.row.encryptedRecord = 'invalid-ciphertext'
      if (reason === 'hash') h.row.tokenHash = captureTokenHash('b'.repeat(64))
      expect(await h.reader.capture(candidate, h.row.id), reason).toEqual({
        id: h.row.id,
        captureToken: null,
      })
    }
  })

  it('refreshes identity for both methods and rejects revoked or substituted-tenant accounts before reading a session', async () => {
    const h = captureReader()
    await expect(
      h.reader.capture({ ...candidate, tenantId: 'another-tenant' }, h.row.id),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    await expect(
      h.reader.findByToken({ ...candidate, tenantId: 'another-tenant' }, h.record.session.token),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    h.user.mockResolvedValue(null)
    await expect(h.reader.capture(candidate, h.row.id)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    await expect(h.reader.findByToken(candidate, h.record.session.token)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
    expect(h.findFirst).not.toHaveBeenCalled()
  })
})

describe('FaceCheck candidate matching', () => {
  function lookup() {
    const query = vi.fn()
    const database = { $queryRaw: query } as unknown as FaceCheckDatabase
    return { query, lookup: new PrismaFaceCheckCandidateLookup(database) }
  }

  it('uses an exact normalized email and prefers a single verified match in the provider tenant', async () => {
    const h = lookup()
    h.query.mockResolvedValueOnce([{ id: 'local', email: 'Candidate@EXAMPLE.test' }])
    expect(await h.lookup.findForContact('agency', '  Candidate@EXAMPLE.test  ')).toBe('local')
    expect(h.query).toHaveBeenCalledTimes(1)
    const sql = h.query.mock.calls[0][0]
    expect(sql.values).toEqual(['candidate@example.test', 'agency'])
    expect(sql.text).toContain('lower(btrim("email")) = $1')
    expect(sql.text).toContain('"tenantId" = $2')
    expect(sql.text).toContain('LIMIT 2')
    expect(sql.text).not.toContain('candidate@example.test')
  })

  it('accepts a unique global account only when there is no local match', async () => {
    const h = lookup()
    h.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'personal-account', email: 'candidate@example.test' }])
    expect(await h.lookup.findForContact('agency', 'candidate@example.test')).toBe(
      'personal-account',
    )
    expect(h.query.mock.calls[1][0].values).toEqual(['candidate@example.test'])
    expect(h.query.mock.calls[1][0].text).not.toContain('"tenantId"')
    expect(h.query.mock.calls[1][0].text).toContain('LIMIT 2')
  })

  it.each([true, false])(
    'refuses ambiguous %s matching instead of selecting an arbitrary account',
    async (local) => {
      const h = lookup()
      if (!local) h.query.mockResolvedValueOnce([])
      h.query.mockResolvedValueOnce([
        { id: 'first', email: 'candidate@example.test' },
        { id: 'second', email: 'CANDIDATE@example.test' },
      ])
      expect(await h.lookup.findForContact('agency', 'candidate@example.test')).toBeNull()
    },
  )

  it.each(['person_name@example.test'])(
    'matches a literal SQL pattern character in the exact email %s',
    async (email) => {
      const h = lookup()
      h.query.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 'literal', email }])
      expect(await h.lookup.findForContact('agency', email.toUpperCase())).toBe('literal')
    },
  )

  it('keeps percent characters invalid under the existing application email validator', async () => {
    const h = lookup()
    expect(await h.lookup.findForContact('agency', 'person%name@example.test')).toBeNull()
    expect(h.query).not.toHaveBeenCalled()
  })

  it.each([
    ['person_name@example.test', 'personXname@example.test'],
    ['person%name@example.test', 'personExpandedname@example.test'],
    ['person\\_name@example.test', 'person_name@example.test'],
  ])('never trusts a pattern-like ORM match for %s', async (contact, returnedEmail) => {
    for (const local of [true, false]) {
      const h = lookup()
      if (!local) h.query.mockResolvedValueOnce([])
      h.query.mockResolvedValueOnce([{ id: 'wrong-account', email: returnedEmail }])
      expect(await h.lookup.findForContact('agency', contact)).toBeNull()
    }
  })

  it.each([null, '', 'Candidate Name', '+55 11 99999-9999', 'Candidate <candidate@example.test>'])(
    'never matches a candidate by a non-email contact: %s',
    async (contact) => {
      const h = lookup()
      expect(await h.lookup.findForContact('agency', contact)).toBeNull()
      expect(h.query).not.toHaveBeenCalled()
    },
  )
})

// @vitest-environment node
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FaceCheckDatabase } from '../types/access'
import type {
  FaceCheckCandidate,
  FaceCheckCandidateVerificationRepository,
} from '../types/candidate'
import { PrismaFaceCheckCandidateLookup } from '../infrastructure/prisma-candidate-lookup'
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

import { randomUUID } from 'node:crypto'
import type { FaceEngine } from '../../types/face-match.types'
import type {
  SessionKey,
  SessionRecord,
  SessionRepository,
  VerificationDependencies,
} from '../../types/verification.types'
import { buildVerificationUseCases, defaultSettings } from '../../verification/container-factory'
import { VerificationError } from '../../verification/domain/verification-error'

class TestSessions implements SessionRepository {
  records = new Map<string, SessionRecord>()
  async insert(record: SessionRecord) {
    this.records.set(record.session.id, structuredClone(record))
  }
  async list() {
    return [...this.records.values()].map((record) => structuredClone(record))
  }
  async read(key: SessionKey) {
    const record =
      'id' in key
        ? this.records.get(key.id)
        : [...this.records.values()].find((item) => item.session.token === key.token)
    return record ? structuredClone(record) : null
  }
  async update<T>(key: SessionKey, change: (record: SessionRecord) => T | Promise<T>) {
    const record = await this.read(key)
    if (!record) throw new VerificationError('SESSION_NOT_FOUND')
    try {
      return await change(record)
    } finally {
      this.records.set(record.session.id, record)
    }
  }
}

export function verificationHarness(engine: FaceEngine | null = passingEngine()) {
  let now = Date.now()
  const sessions = new TestSessions()
  const photos = new Map<string, { bytes: Uint8Array; contentType: string }>()
  let settings = defaultSettings('Tenant agency')
  const deps: VerificationDependencies = {
    actorId: 'operator',
    sessions,
    photos: {
      save: async (sessionId, evidenceId, image) => {
        photos.set(`${sessionId}:${evidenceId}`, image)
      },
      load: async (sessionId, evidenceId) => photos.get(`${sessionId}:${evidenceId}`) ?? null,
    },
    settings: {
      get: async () => settings,
      save: async (value) => {
        settings = value
        return value
      },
    },
    analyses: { start: async (task) => task(), idle: async () => {} },
    faceEngine: engine,
    clock: () => now,
    random: () => 0.5,
    newId: randomUUID,
    newToken: () => randomUUID().replaceAll('-', '').repeat(2),
  }
  return {
    deps,
    sessions,
    photos,
    cases: buildVerificationUseCases(deps),
    advance: (milliseconds: number) => {
      now += milliseconds
    },
  }
}

export function passingEngine(): FaceEngine {
  return {
    inspect: async (kind) => ({
      issues: [],
      hashes: [
        kind === 'front'
          ? '0000000000000000'
          : kind === 'back'
            ? 'ffffffffffffffff'
            : 'aaaaaaaaaaaaaaaa',
      ],
      liveScore: 0.99,
      document:
        kind === 'selfie'
          ? null
          : {
              cardDetected: true,
              documentType: 'RG',
              cpfRead: false,
              cpfMatches: null,
              nameFound: true,
            },
    }),
    verifyLiveness: async () => ({ passed: true, issues: [], liveScore: 0.99 }),
    match: async () => ({
      similarity: 0.7,
      document: { opened: true, facesFound: 1, detectionScore: 0.99, interocularPx: 100 },
      selfie: { opened: true, facesFound: 1, detectionScore: 0.99, interocularPx: 120 },
    }),
  }
}

export const createInput = {
  propertyId: 'property-1',
  purpose: 'RENT' as const,
  personName: 'Test Person',
  cpf: '',
  reference: '',
  contact: 'candidate@example.test',
  acceptedDocument: 'RG' as const,
  expiresInHours: 24,
}
export const photo = (value: number) => ({
  bytes: new Uint8Array([value]),
  contentType: 'image/jpeg',
})

export async function captureAll(harness: ReturnType<typeof verificationHarness>) {
  const session = await harness.cases.createSessionUseCase.execute(createInput)
  const token = session.token
  await harness.cases.consentUseCase.execute(token, {
    accepted: true,
    termsVersion: 'camera-2026-10-31-retention-v1',
  })
  await harness.cases.uploadDocumentPhotoUseCase.execute(token, 'front', 'RG', photo(1))
  await harness.cases.uploadDocumentPhotoUseCase.execute(token, 'back', 'RG', photo(2))
  await harness.cases.uploadSelfieUseCase.execute(token, photo(3))
  const challenges = await harness.cases.getChallengesUseCase.execute(token)
  for (const challenge of challenges)
    await harness.cases.verifyLivenessFrameUseCase.execute(token, challenge, photo(4))
  return session
}

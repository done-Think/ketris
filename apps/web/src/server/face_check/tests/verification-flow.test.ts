// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  captureAll,
  createInput,
  passingEngine,
  photo,
  verificationHarness,
} from './fixtures/verification-harness'

describe('face_check real capture workflow', () => {
  it('checks physical image presence before approval even when metadata and an override are present', async () => {
    const h = verificationHarness()
    const session = await captureAll(h)
    await h.cases.submitCaptureUseCase.execute(session.token)
    await h.cases.recordEvidenceViewUseCase.execute(session.id)
    const metadata = (await h.cases.getSessionUseCase.execute(session.id)).evidenceHistory.find(
      (evidence) => evidence.step === 'selfie',
    )!
    h.photos.delete(`${session.id}:${metadata.id}`)
    await expect(
      h.cases.decideSessionUseCase.execute(session.id, {
        decision: 'approve',
        reason: 'liveness',
        note: 'Responsible person reviewed the available records.',
        manualOverride: true,
      }),
    ).rejects.toMatchObject({ code: 'EVIDENCE_DELETED', status: 410 })
    expect((await h.cases.getSessionUseCase.execute(session.id)).status).toBe('REVIEW')
  })

  it('retains the failed storage attempt metadata without claiming a photo exists', async () => {
    const h = verificationHarness()
    const session = await h.cases.createSessionUseCase.execute(createInput)
    await h.cases.consentUseCase.execute(session.token, {
      accepted: true,
      termsVersion: 'camera-2026-10-31-retention-v1',
    })
    h.deps.photos.save = async () => {
      throw new Error('storage unavailable')
    }
    await expect(
      h.cases.uploadDocumentPhotoUseCase.execute(session.token, 'front', 'RG', photo(1)),
    ).rejects.toThrow('storage unavailable')
    expect((await h.cases.getSessionUseCase.execute(session.id)).evidenceHistory[0]).toMatchObject({
      status: 'unavailable',
      stored: false,
      step: 'front',
    })
    expect(h.photos.size).toBe(0)
  })
  it('allows an explicit human override of failed liveness while preserving the failed biometric evidence', async () => {
    const engine = passingEngine()
    engine.verifyLiveness = async () => ({
      passed: false,
      issues: ['livenessNotTurned'],
      liveScore: 0.7,
    })
    const h = verificationHarness(engine)
    const session = await h.cases.createSessionUseCase.execute(createInput)
    await h.cases.consentUseCase.execute(session.token, {
      accepted: true,
      termsVersion: 'camera-2026-10-31-retention-v1',
    })
    await h.cases.uploadDocumentPhotoUseCase.execute(session.token, 'front', 'RG', photo(1))
    await h.cases.uploadDocumentPhotoUseCase.execute(session.token, 'back', 'RG', photo(2))
    await h.cases.uploadSelfieUseCase.execute(session.token, photo(3))
    const [challenge] = await h.cases.getChallengesUseCase.execute(session.token)
    await expect(
      h.cases.verifyLivenessFrameUseCase.execute(session.token, challenge, photo(4)),
    ).rejects.toMatchObject({ code: 'LIVENESS_FAILED' })
    await h.cases.requestAlternativeUseCase.execute(session.token, {
      reason: 'accessibility',
      contact: '',
    })
    await h.cases.recordEvidenceViewUseCase.execute(session.id)
    await expect(
      h.cases.decideSessionUseCase.execute(session.id, {
        decision: 'approve',
        reason: null,
        note: '',
      }),
    ).rejects.toMatchObject({ code: 'VERIFICATION_INCOMPLETE' })
    await expect(
      h.cases.decideSessionUseCase.execute(session.id, {
        decision: 'approve',
        reason: 'liveness',
        note: 'short',
        manualOverride: true,
      }),
    ).rejects.toMatchObject({ code: 'MANUAL_OVERRIDE_INVALID' })
    const approved = await h.cases.decideSessionUseCase.execute(session.id, {
      decision: 'approve',
      reason: 'liveness',
      note: 'Identity reviewed with the responsible agent.',
      manualOverride: true,
    })
    expect(approved).toMatchObject({
      status: 'APPROVED',
      decisionMethod: 'MANUAL',
      manualOverride: true,
      evidencePurgePending: true,
    })
    expect(approved.timeline.some((event) => event.kind === 'livenessVerified')).toBe(false)
    expect(approved.evidenceHistory.find((evidence) => evidence.step === 'liveness')).toMatchObject(
      { status: 'rejected', reason: 'livenessNotTurned' },
    )
    expect(approved.timeline.at(-1)).toMatchObject({
      kind: 'decision',
      decisionMethod: 'MANUAL',
      manualOverride: true,
      reason: 'liveness',
    })
    await expect(h.cases.getEvidenceUseCase.execute(session.id, 'front')).rejects.toMatchObject({
      code: 'EVIDENCE_DELETED',
      status: 410,
    })
  })

  it('blocks every approval after image retention expires, including an explicit override', async () => {
    const h = verificationHarness()
    const session = await captureAll(h)
    await h.cases.submitCaptureUseCase.execute(session.token)
    await h.cases.recordEvidenceViewUseCase.execute(session.id)
    await h.sessions.update({ id: session.id }, (record) => {
      record.session.evidenceExpiresAt = new Date(h.deps.clock() - 1).toISOString()
    })
    for (const manualOverride of [false, true])
      await expect(
        h.cases.decideSessionUseCase.execute(session.id, {
          decision: 'approve',
          reason: 'liveness',
          note: 'Reviewed but images have already expired.',
          manualOverride,
        }),
      ).rejects.toMatchObject({ code: 'EVIDENCE_DELETED', status: 410 })
    expect((await h.cases.getSessionUseCase.execute(session.id)).status).toBe('REVIEW')
  })
  it('keeps successful analysis in REVIEW and requires the reviewer to reveal evidence before approval', async () => {
    const h = verificationHarness()
    const session = await captureAll(h)
    await h.cases.submitCaptureUseCase.execute(session.token)
    expect((await h.cases.getSessionUseCase.execute(session.id)).status).toBe('REVIEW')
    await expect(
      h.cases.decideSessionUseCase.execute(session.id, {
        decision: 'approve',
        reason: null,
        note: '',
      }),
    ).rejects.toMatchObject({ code: 'VERIFICATION_INCOMPLETE' })
    await h.cases.recordEvidenceViewUseCase.execute(session.id)
    const approved = await h.cases.decideSessionUseCase.execute(session.id, {
      decision: 'approve',
      reason: null,
      note: 'Reviewed',
    })
    expect(approved.status).toBe('APPROVED')
    expect(approved.evidenceHistory).toHaveLength(6)
    expect(approved.timeline.some((event) => event.kind === 'autoApproved')).toBe(false)
    await expect(
      h.cases.consentUseCase.execute(session.token, {
        accepted: true,
        termsVersion: 'camera-2026-10-31-retention-v1',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_CAPTURE_STATE' })
  })

  it('keeps engine failures in REVIEW and never permits an incomplete manual approval', async () => {
    const engine = passingEngine()
    engine.match = async () => {
      throw new Error('offline')
    }
    const h = verificationHarness(engine)
    const session = await captureAll(h)
    await h.cases.submitCaptureUseCase.execute(session.token)
    await h.cases.recordEvidenceViewUseCase.execute(session.id)
    const result = await h.cases.getSessionUseCase.execute(session.id)
    expect(result).toMatchObject({
      status: 'REVIEW',
      reviewReason: 'analysisUnavailable',
      signals: [],
    })
    await expect(
      h.cases.decideSessionUseCase.execute(session.id, {
        decision: 'approve',
        reason: null,
        note: '',
      }),
    ).rejects.toMatchObject({ code: 'VERIFICATION_INCOMPLETE' })
  })

  it('retains a photo and unavailable diagnostics when inspection fails', async () => {
    const engine = passingEngine()
    engine.inspect = async () => {
      throw new Error('offline')
    }
    const h = verificationHarness(engine)
    const session = await h.cases.createSessionUseCase.execute(createInput)
    await h.cases.consentUseCase.execute(session.token, {
      accepted: true,
      termsVersion: 'camera-2026-10-31-retention-v1',
    })
    await expect(
      h.cases.uploadDocumentPhotoUseCase.execute(session.token, 'front', 'RG', photo(1)),
    ).rejects.toMatchObject({ code: 'ANALYSIS_UNAVAILABLE', status: 503 })
    expect((await h.cases.getSessionUseCase.execute(session.id)).evidenceHistory[0]).toMatchObject({
      status: 'unavailable',
      step: 'front',
    })
    expect(h.photos.size).toBe(1)
  })

  it('checks consent, document order and the issued challenge deadline on the server', async () => {
    const h = verificationHarness()
    const session = await h.cases.createSessionUseCase.execute(createInput)
    await expect(h.cases.getChallengesUseCase.execute(session.token)).rejects.toMatchObject({
      code: 'INVALID_CAPTURE_STATE',
    })
    await h.cases.consentUseCase.execute(session.token, {
      accepted: true,
      termsVersion: 'camera-2026-10-31-retention-v1',
    })
    await expect(
      h.cases.uploadSelfieUseCase.execute(session.token, photo(3)),
    ).rejects.toMatchObject({ code: 'INVALID_CAPTURE_STATE' })
    await expect(
      h.cases.uploadDocumentPhotoUseCase.execute(session.token, 'back', 'RG', photo(2)),
    ).rejects.toMatchObject({ code: 'INVALID_CAPTURE_STATE' })
    await h.cases.uploadDocumentPhotoUseCase.execute(session.token, 'front', 'RG', photo(1))
    await h.cases.uploadDocumentPhotoUseCase.execute(session.token, 'back', 'RG', photo(2))
    await h.cases.uploadSelfieUseCase.execute(session.token, photo(3))
    const challenges = await h.cases.getChallengesUseCase.execute(session.token)
    h.advance(16_000)
    await expect(
      h.cases.verifyLivenessFrameUseCase.execute(session.token, challenges[0], photo(4)),
    ).rejects.toMatchObject({ code: 'LIVENESS_FAILED', reason: 'livenessExpired' })
    expect(
      (await h.cases.getSessionUseCase.execute(session.id)).evidenceHistory.at(-1),
    ).toMatchObject({ status: 'rejected', reason: 'livenessExpired' })
  })

  it('rotates the token after a human redo and preserves previous decisions', async () => {
    const h = verificationHarness()
    const session = await captureAll(h)
    await h.cases.submitCaptureUseCase.execute(session.token)
    const redone = await h.cases.decideSessionUseCase.execute(session.id, {
      decision: 'redo',
      reason: 'illegible',
      note: 'Retake',
    })
    expect(redone.token).not.toBe(session.token)
    await expect(h.cases.getCaptureSessionUseCase.execute(session.token)).rejects.toMatchObject({
      code: 'SESSION_NOT_FOUND',
    })
    expect(redone.timeline.findLast((event) => event.kind === 'decision')).toMatchObject({
      actor: 'operator',
      decision: 'redo',
      note: 'Retake',
    })
    expect(redone.evidenceHistory).toHaveLength(6)
  })

  it('does not approve the document continuation path after three rejected images', async () => {
    const engine = passingEngine()
    const inspect = engine.inspect
    engine.inspect = async (...args) => ({
      ...(await inspect(...args)),
      issues: args[0] === 'front' ? ['documentShapeNotFound'] : [],
    })
    const h = verificationHarness(engine)
    const session = await h.cases.createSessionUseCase.execute(createInput)
    await h.cases.consentUseCase.execute(session.token, {
      accepted: true,
      termsVersion: 'camera-2026-10-31-retention-v1',
    })
    for (let count = 0; count < 2; count++)
      await expect(
        h.cases.uploadDocumentPhotoUseCase.execute(session.token, 'front', 'RG', photo(1)),
      ).rejects.toMatchObject({ code: 'PHOTO_REJECTED' })
    await h.cases.uploadDocumentPhotoUseCase.execute(session.token, 'front', 'RG', photo(1))
    await h.cases.uploadDocumentPhotoUseCase.execute(session.token, 'back', 'RG', photo(2))
    await h.cases.uploadSelfieUseCase.execute(session.token, photo(3))
    for (const challenge of await h.cases.getChallengesUseCase.execute(session.token))
      await h.cases.verifyLivenessFrameUseCase.execute(session.token, challenge, photo(4))
    await h.cases.submitCaptureUseCase.execute(session.token)
    await h.cases.recordEvidenceViewUseCase.execute(session.id)
    await expect(
      h.cases.decideSessionUseCase.execute(session.id, {
        decision: 'approve',
        reason: null,
        note: '',
      }),
    ).rejects.toMatchObject({ code: 'VERIFICATION_INCOMPLETE' })
  })
})

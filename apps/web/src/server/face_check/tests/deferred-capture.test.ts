// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import {
  createInput,
  passingEngine,
  photo,
  verificationHarness,
} from './fixtures/verification-harness'

async function prepared() {
  const engine = passingEngine()
  const inspect = vi.spyOn(engine, 'inspect')
  const h = verificationHarness(engine)
  const session = await h.cases.createSessionUseCase.execute(createInput)
  await h.cases.consentUseCase.execute(session.token, {
    accepted: true,
    termsVersion: 'camera-2026-10-31-retention-v1',
  })
  const plan = await h.cases.prepareLivenessUseCase.execute(session.token)
  return { ...h, engine, inspect, session, plan }
}

async function uploadPhotos(h: Awaited<ReturnType<typeof prepared>>) {
  const token = h.session.token
  await h.cases.uploadDocumentPhotoUseCase.execute(token, 'front', 'RG', photo(1), h.plan.planId)
  await h.cases.uploadDocumentPhotoUseCase.execute(token, 'back', 'RG', photo(2), h.plan.planId)
  await h.cases.uploadSelfieUseCase.execute(token, photo(3), h.plan.planId)
}

describe('session-bound deferred capture', () => {
  it('accepts a replacement for a rejected back under the same plan without losing the accepted front', async () => {
    const h = await prepared()
    const token = h.session.token
    await h.cases.uploadDocumentPhotoUseCase.execute(token, 'front', 'RG', photo(1), h.plan.planId)
    const before = await h.sessions.read({ id: h.session.id })
    const inspect = passingEngine().inspect
    h.inspect.mockImplementationOnce(async (...args) => ({
      ...(await inspect(...args)),
      issues: ['documentTextNotFound'],
    }))
    await expect(
      h.cases.uploadDocumentPhotoUseCase.execute(token, 'back', 'RG', photo(2), h.plan.planId),
    ).rejects.toMatchObject({ code: 'PHOTO_REJECTED', reason: 'documentTextNotFound' })
    await h.cases.uploadDocumentPhotoUseCase.execute(token, 'back', 'RG', photo(5), h.plan.planId)
    const after = await h.sessions.read({ id: h.session.id })
    expect(after?.capture.photos.front).toEqual(before?.capture.photos.front)
    expect(after?.capture.plan).toEqual(before?.capture.plan)
    expect(after?.session.captureDeadline).toBe(before?.session.captureDeadline)
    expect(after?.capture.photos.back).toBeDefined()
    await h.cases.uploadSelfieUseCase.execute(token, photo(3), h.plan.planId)
    await h.cases.startLivenessUseCase.execute(token, h.plan.planId)
    for (const challenge of h.plan.challenges)
      await h.cases.verifyLivenessFrameUseCase.execute(token, challenge, photo(4), h.plan.planId)
    await h.cases.submitCaptureUseCase.execute(token, h.plan.planId)
    expect((await h.sessions.read({ id: h.session.id }))?.session.status).toBe('REVIEW')
  })

  it('issues a movement plan before any photos are uploaded or analyzed', async () => {
    const h = await prepared()
    expect(h.plan.challenges).toEqual(['turnLeft', 'turnRight', 'closer'])
    expect(h.plan.step).toBe(0)
    expect(h.photos.size).toBe(0)
    expect(h.inspect).not.toHaveBeenCalled()
    expect(h.plan.expiresAt).toBe(
      (await h.sessions.read({ id: h.session.id }))?.session.captureDeadline,
    )
  })

  it('rejects missing, forged and cross-session plans before storing evidence', async () => {
    const h = await prepared()
    for (const id of [undefined, '11111111-1111-4111-8111-111111111111'])
      await expect(
        h.cases.uploadDocumentPhotoUseCase.execute(h.session.token, 'front', 'RG', photo(1), id),
      ).rejects.toMatchObject({ code: 'INVALID_CAPTURE_STATE' })
    const other = await h.cases.createSessionUseCase.execute(createInput)
    await h.cases.consentUseCase.execute(other.token, {
      accepted: true,
      termsVersion: 'camera-2026-10-31-retention-v1',
    })
    await h.cases.prepareLivenessUseCase.execute(other.token)
    await expect(
      h.cases.uploadDocumentPhotoUseCase.execute(
        other.token,
        'front',
        'RG',
        photo(1),
        h.plan.planId,
      ),
    ).rejects.toMatchObject({ code: 'INVALID_CAPTURE_STATE' })
    expect(h.photos.size).toBe(0)
  })

  it('requires the same plan on selfie, movements, validation start and final submission', async () => {
    const h = await prepared()
    const wrong = '11111111-1111-4111-8111-111111111111'
    await expect(
      h.cases.uploadSelfieUseCase.execute(h.session.token, photo(3), wrong),
    ).rejects.toMatchObject({ code: 'INVALID_CAPTURE_STATE' })
    await expect(
      h.cases.verifyLivenessFrameUseCase.execute(h.session.token, 'turnLeft', photo(4), wrong),
    ).rejects.toMatchObject({ code: 'INVALID_CAPTURE_STATE' })
    await expect(
      h.cases.startLivenessUseCase.execute(h.session.token, wrong),
    ).rejects.toMatchObject({ code: 'INVALID_CAPTURE_STATE' })
    await expect(
      h.cases.submitCaptureUseCase.execute(h.session.token, wrong),
    ).rejects.toMatchObject({ code: 'INVALID_CAPTURE_STATE' })
    expect(h.photos.size).toBe(0)
  })

  it('validates the deferred sequence in the backend and submits only a complete capture', async () => {
    const h = await prepared()
    h.advance(30_000)
    await uploadPhotos(h)
    await expect(
      h.cases.submitCaptureUseCase.execute(h.session.token, h.plan.planId),
    ).rejects.toMatchObject({ code: 'LIVENESS_FAILED' })
    await h.cases.startLivenessUseCase.execute(h.session.token, h.plan.planId)
    for (const challenge of h.plan.challenges)
      await h.cases.verifyLivenessFrameUseCase.execute(
        h.session.token,
        challenge,
        photo(4),
        h.plan.planId,
      )
    await h.cases.submitCaptureUseCase.execute(h.session.token, h.plan.planId)
    expect(h.inspect).toHaveBeenCalledTimes(3)
    expect((await h.sessions.read({ id: h.session.id }))?.session.status).toBe('REVIEW')
  })

  it('preserves accepted movements when the remaining local photos need to be recaptured', async () => {
    const h = await prepared()
    await uploadPhotos(h)
    await h.cases.startLivenessUseCase.execute(h.session.token, h.plan.planId)
    await h.cases.verifyLivenessFrameUseCase.execute(
      h.session.token,
      'turnLeft',
      photo(4),
      h.plan.planId,
    )
    h.engine.verifyLiveness = async () => ({
      passed: false,
      issues: ['livenessNotTurned'],
      liveScore: 0.9,
    })
    await expect(
      h.cases.verifyLivenessFrameUseCase.execute(
        h.session.token,
        'turnRight',
        photo(5),
        h.plan.planId,
      ),
    ).rejects.toMatchObject({ code: 'LIVENESS_FAILED' })
    const resumed = await h.cases.prepareLivenessUseCase.execute(h.session.token)
    expect(resumed).toMatchObject({ planId: h.plan.planId, step: 1 })
  })

  it('invalidates an old plan when restarting, without resetting rejection limits or extending consent', async () => {
    const h = await prepared()
    await uploadPhotos(h)
    h.engine.verifyLiveness = async () => ({
      passed: false,
      issues: ['livenessNotTurned'],
      liveScore: 0.9,
    })
    await expect(
      h.cases.verifyLivenessFrameUseCase.execute(
        h.session.token,
        'turnLeft',
        photo(4),
        h.plan.planId,
      ),
    ).rejects.toMatchObject({ code: 'LIVENESS_FAILED' })
    const before = await h.sessions.read({ id: h.session.id })
    h.advance(5000)
    const next = await h.cases.prepareLivenessUseCase.execute(h.session.token, true)
    const after = await h.sessions.read({ id: h.session.id })
    expect(next.planId).not.toBe(h.plan.planId)
    expect(after?.capture.rejections).toEqual(before?.capture.rejections)
    expect(after?.session.captureDeadline).toBe(before?.session.captureDeadline)
    expect(after?.session.evidenceHistory).toEqual(before?.session.evidenceHistory)
    await expect(
      h.cases.uploadSelfieUseCase.execute(h.session.token, photo(3), h.plan.planId),
    ).rejects.toMatchObject({ code: 'INVALID_CAPTURE_STATE' })
  })

  it('requires consent and rejects expired plans before receiving photos', async () => {
    const h = await prepared()
    const other = await h.cases.createSessionUseCase.execute(createInput)
    await expect(h.cases.prepareLivenessUseCase.execute(other.token)).rejects.toMatchObject({
      code: 'INVALID_CAPTURE_STATE',
    })
    h.advance(16 * 60_000)
    await expect(h.cases.prepareLivenessUseCase.execute(h.session.token)).rejects.toMatchObject({
      code: 'SESSION_EXPIRED',
    })
    await expect(
      h.cases.uploadDocumentPhotoUseCase.execute(
        h.session.token,
        'front',
        'RG',
        photo(1),
        h.plan.planId,
      ),
    ).rejects.toMatchObject({ code: 'SESSION_EXPIRED' })
    expect(h.photos.size).toBe(0)
  })
})

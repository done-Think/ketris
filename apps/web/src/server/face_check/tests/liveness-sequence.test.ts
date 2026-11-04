// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  createInput,
  passingEngine,
  photo,
  verificationHarness,
} from './fixtures/verification-harness'

async function prepared() {
  const engine = passingEngine()
  const h = verificationHarness(engine)
  h.deps.random = () => 0
  const session = await h.cases.createSessionUseCase.execute(createInput)
  await h.cases.consentUseCase.execute(session.token, {
    accepted: true,
    termsVersion: 'camera-2026-10-31-retention-v1',
  })
  await h.cases.uploadDocumentPhotoUseCase.execute(session.token, 'front', 'RG', photo(1))
  await h.cases.uploadDocumentPhotoUseCase.execute(session.token, 'back', 'RG', photo(2))
  await h.cases.uploadSelfieUseCase.execute(session.token, photo(3))
  return { ...h, engine, session }
}

describe('ordered liveness sequence', () => {
  it('requires a consented selfie and stops resuming when failures trigger human review', async () => {
    const h = await prepared()
    const other = await h.cases.createSessionUseCase.execute(createInput)
    await expect(h.cases.startLivenessUseCase.execute(other.token)).rejects.toMatchObject({
      code: 'INVALID_CAPTURE_STATE',
    })
    h.engine.verifyLiveness = async () => ({
      passed: false,
      issues: ['livenessNotTurned'],
      liveScore: 0.9,
    })
    for (let attempt = 0; attempt < 5; attempt++) {
      await h.cases.startLivenessUseCase.execute(h.session.token)
      await expect(
        h.cases.verifyLivenessFrameUseCase.execute(h.session.token, 'turnLeft', photo(4)),
      ).rejects.toMatchObject({ code: 'LIVENESS_FAILED' })
    }
    expect((await h.sessions.read({ id: h.session.id }))?.session.status).toBe('REVIEW')
    await expect(h.cases.startLivenessUseCase.execute(h.session.token)).rejects.toMatchObject({
      code: 'INVALID_CAPTURE_STATE',
    })
  })
  it('always issues left then right then proximity, independently of random sampling', async () => {
    const h = await prepared()
    expect(await h.cases.getChallengesUseCase.execute(h.session.token)).toEqual([
      'turnLeft',
      'turnRight',
      'closer',
    ])
  })

  it('starts the step window when capture is started and never extends the overall session window', async () => {
    const h = await prepared()
    const before = (await h.sessions.read({ id: h.session.id }))!.session.captureDeadline
    h.advance(30_000)
    expect(await h.cases.startLivenessUseCase.execute(h.session.token)).toEqual({
      challenges: ['turnLeft', 'turnRight', 'closer'],
      step: 0,
    })
    await expect(
      h.cases.verifyLivenessFrameUseCase.execute(h.session.token, 'turnLeft', photo(4)),
    ).resolves.toEqual({ remaining: 2 })
    expect((await h.sessions.read({ id: h.session.id }))!.session.captureDeadline).toBe(before)
  })

  it('keeps the accepted left turn after a failed right turn, resuming at the right', async () => {
    const h = await prepared()
    await h.cases.startLivenessUseCase.execute(h.session.token)
    await h.cases.verifyLivenessFrameUseCase.execute(h.session.token, 'turnLeft', photo(4))
    h.engine.verifyLiveness = async () => ({
      passed: false,
      issues: ['livenessNotTurned'],
      liveScore: 0.9,
    })
    await expect(
      h.cases.verifyLivenessFrameUseCase.execute(h.session.token, 'turnRight', photo(5)),
    ).rejects.toMatchObject({ code: 'LIVENESS_FAILED', reason: 'livenessNotTurned' })
    expect(await h.cases.startLivenessUseCase.execute(h.session.token)).toMatchObject({ step: 1 })
    const stored = await h.sessions.read({ id: h.session.id })
    expect(
      stored?.session.evidenceHistory.filter(
        (item) => item.challenge === 'turnLeft' && item.status === 'accepted',
      ),
    ).toHaveLength(1)
    expect(stored?.capture.livenessVerified).toBe(false)
  })

  it('synchronizes already accepted movements after an acknowledgement is lost', async () => {
    const h = await prepared()
    await h.cases.startLivenessUseCase.execute(h.session.token)
    for (const challenge of ['turnLeft', 'turnRight', 'closer'] as const) {
      await h.cases.verifyLivenessFrameUseCase.execute(h.session.token, challenge, photo(4))
    }
    expect(await h.cases.startLivenessUseCase.execute(h.session.token)).toMatchObject({ step: 3 })
  })

  it('still refuses out of order frames and expired capture access', async () => {
    const h = await prepared()
    await h.cases.startLivenessUseCase.execute(h.session.token)
    await expect(
      h.cases.verifyLivenessFrameUseCase.execute(h.session.token, 'turnRight', photo(5)),
    ).rejects.toMatchObject({ code: 'LIVENESS_FAILED', reason: 'livenessOutOfOrder' })
    expect(await h.cases.startLivenessUseCase.execute(h.session.token)).toMatchObject({ step: 0 })
    h.advance(16 * 60_000)
    await expect(h.cases.startLivenessUseCase.execute(h.session.token)).rejects.toMatchObject({
      code: 'SESSION_EXPIRED',
    })
  })
})

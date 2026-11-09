// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import {
  createInput,
  passingEngine,
  photo,
  verificationHarness,
} from './fixtures/verification-harness'

async function captured(engine = passingEngine()) {
  const h = verificationHarness(engine)
  const session = await h.cases.createSessionUseCase.execute(createInput)
  const { token } = session
  await h.cases.consentUseCase.execute(token, {
    accepted: true,
    termsVersion: 'camera-2026-10-31-retention-v1',
  })
  const plan = await h.cases.prepareLivenessUseCase.execute(token)
  await h.cases.uploadDocumentPhotoUseCase.execute(token, 'front', 'RG', photo(1), plan.planId)
  await h.cases.uploadDocumentPhotoUseCase.execute(token, 'back', 'RG', photo(2), plan.planId)
  await h.cases.uploadSelfieUseCase.execute(token, photo(3), plan.planId)
  await h.cases.startLivenessUseCase.execute(token, plan.planId)
  for (const [index, challenge] of plan.challenges.entries())
    await h.cases.verifyLivenessFrameUseCase.execute(
      token,
      challenge,
      photo(index + 4),
      plan.planId,
    )
  return { ...h, session, plan }
}

describe('single submission followed by responsible human review', () => {
  it.each(['front', 'back', 'selfie', 'liveness', 'similarity', 'offline'] as const)(
    'receives every image once and keeps a %s failure for the reviewer',
    async (failure) => {
      const engine = passingEngine()
      const inspect = vi.spyOn(engine, 'inspect')
      const original = passingEngine().inspect
      inspect.mockImplementation(async (...args) => {
        if (failure === 'offline') throw new Error('engine offline')
        return { ...(await original(...args)), issues: args[0] === failure ? ['blurry'] : [] }
      })
      if (failure === 'liveness')
        engine.verifyLiveness = async () => ({
          passed: false,
          issues: ['livenessNotTurned'],
          liveScore: 0.6,
        })
      if (failure === 'similarity') {
        const result = await engine.match(new Uint8Array(), new Uint8Array())
        engine.match = async () => ({ ...result, similarity: 0.1 })
      }
      const h = await captured(engine)
      expect(inspect).not.toHaveBeenCalled()
      expect(h.photos.size).toBe(6)
      await h.cases.submitCaptureUseCase.execute(h.session.token, h.plan.planId)
      const reviewed = await h.cases.getSessionUseCase.execute(h.session.id)
      expect(reviewed.status).toBe('REVIEW')
      expect(reviewed.redoReason).toBeNull()
      expect(reviewed.evidenceHistory).toHaveLength(6)
      expect(reviewed.attemptsUsed).toBe(1)
      expect(reviewed.timeline.some((event) => event.kind === 'autoRedo')).toBe(false)
      if (failure === 'liveness')
        expect(
          reviewed.evidenceHistory
            .filter((item) => item.step === 'liveness')
            .every((item) => item.status === 'rejected'),
        ).toBe(true)
      if (['front', 'back', 'selfie'].includes(failure))
        expect(reviewed.evidenceHistory.find((item) => item.step === failure)).toMatchObject({
          status: 'rejected',
          reason: 'blurry',
        })
      await expect(
        h.cases.decideSessionUseCase.execute(h.session.id, {
          decision: 'approve',
          reason: null,
          note: '',
        }),
      ).rejects.toMatchObject({ code: 'VERIFICATION_INCOMPLETE' })
    },
  )

  it('acknowledges submission before running the engine and remains readable under an analysis lease', async () => {
    const engine = passingEngine()
    const inspect = vi.spyOn(engine, 'inspect')
    const h = await captured(engine)
    let background!: () => Promise<void>
    h.deps.analyses.start = async (task) => {
      background = task
    }
    const receipt = await h.cases.submitCaptureUseCase.execute(h.session.token, h.plan.planId)
    expect(receipt.status).toBe('PROCESSING')
    expect(inspect).not.toHaveBeenCalled()
    const update = vi
      .spyOn(h.deps.sessions, 'update')
      .mockRejectedValue({ code: 'PERSISTENCE_BUSY' })
    expect((await h.cases.getSessionUseCase.execute(h.session.id)).status).toBe('PROCESSING')
    expect((await h.cases.getCaptureSessionUseCase.execute(h.session.token)).status).toBe(
      'PROCESSING',
    )
    expect((await h.cases.getCaptureStatusUseCase.execute(h.session.token)).status).toBe(
      'PROCESSING',
    )
    expect(update).not.toHaveBeenCalled()
    await expect(background()).resolves.toBeUndefined()
    expect(inspect).not.toHaveBeenCalled()
    update.mockRestore()
    await background()
    expect((await h.cases.getSessionUseCase.execute(h.session.id)).status).toBe('REVIEW')
  })

  it('resumes analysis checkpoints after interruption without repeating uploads or completed inspections', async () => {
    const engine = passingEngine()
    const inspect = vi.spyOn(engine, 'inspect')
    const h = await captured(engine)
    h.deps.analyses.start = async () => {}
    await h.cases.submitCaptureUseCase.execute(h.session.token, h.plan.planId)
    await h.cases.analyzeSessionUseCase.execute(h.session.id, 1)
    expect(inspect).toHaveBeenCalledTimes(1)
    expect((await h.cases.getSessionUseCase.execute(h.session.id)).status).toBe('PROCESSING')
    await h.cases.analyzeSessionUseCase.execute(h.session.id)
    expect(inspect).toHaveBeenCalledTimes(3)
    expect(h.photos.size).toBe(6)
    expect((await h.cases.getSessionUseCase.execute(h.session.id)).status).toBe('REVIEW')
  })

  it('deduplicates received photos, poses and a final acknowledgement lost in transit', async () => {
    const h = await captured()
    const { token } = h.session
    await h.cases.uploadSelfieUseCase.execute(token, photo(3), h.plan.planId)
    await expect(
      h.cases.verifyLivenessFrameUseCase.execute(token, 'closer', photo(6), h.plan.planId),
    ).resolves.toEqual({ remaining: 0 })
    expect(h.photos.size).toBe(6)
    await h.cases.submitCaptureUseCase.execute(token, h.plan.planId)
    await expect(h.cases.submitCaptureUseCase.execute(token, h.plan.planId)).resolves.toMatchObject(
      { status: 'REVIEW' },
    )
    expect((await h.cases.getSessionUseCase.execute(h.session.id)).attemptsUsed).toBe(1)
    expect(h.photos.size).toBe(6)
    await expect(
      h.cases.uploadSelfieUseCase.execute(token, photo(3), h.plan.planId),
    ).rejects.toMatchObject({ code: 'INVALID_CAPTURE_STATE' })
  })
})

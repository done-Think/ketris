// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import {
  createInput,
  passingEngine,
  photo,
  verificationHarness,
} from './fixtures/verification-harness'

const result = {
  width: 640,
  height: 360,
  faceCount: 1,
  face: { x: 0.3, y: 0.2, width: 0.4, height: 0.6 },
}

async function prepared() {
  const engine = { ...passingEngine(), framing: vi.fn(async () => result) }
  const h = verificationHarness(engine)
  const session = await h.cases.createSessionUseCase.execute(createInput)
  await h.cases.consentUseCase.execute(session.token, {
    accepted: true,
    termsVersion: 'camera-2026-10-31-retention-v1',
  })
  await h.cases.uploadDocumentPhotoUseCase.execute(session.token, 'front', 'RG', photo(1))
  await h.cases.uploadDocumentPhotoUseCase.execute(session.token, 'back', 'RG', photo(2))
  return { ...h, engine, session }
}

describe('transient selfie placement', () => {
  it('does not save probes, write session state, consume attempts or extend capture deadlines', async () => {
    const h = await prepared()
    const before = await h.sessions.read({ id: h.session.id })
    const save = vi.spyOn(h.deps.photos, 'save')
    const load = vi.spyOn(h.deps.photos, 'load')
    const update = vi.spyOn(h.sessions, 'update')
    expect(await h.cases.selfieFramingUseCase.execute(h.session.token, photo(9).bytes)).toEqual(
      result,
    )
    expect(await h.sessions.read({ id: h.session.id })).toEqual(before)
    expect(h.photos.size).toBe(2)
    expect(save).not.toHaveBeenCalled()
    expect(load).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
  })

  it('refuses probes before consent and before both document sides exist', async () => {
    const h = await prepared()
    const other = await h.cases.createSessionUseCase.execute(createInput)
    await expect(
      h.cases.selfieFramingUseCase.execute(other.token, photo(9).bytes),
    ).rejects.toMatchObject({ code: 'INVALID_CAPTURE_STATE' })
    await h.cases.consentUseCase.execute(other.token, {
      accepted: true,
      termsVersion: 'camera-2026-10-31-retention-v1',
    })
    await expect(
      h.cases.selfieFramingUseCase.execute(other.token, photo(9).bytes),
    ).rejects.toMatchObject({ code: 'IMAGE_REQUIRED' })
    expect(h.engine.framing).not.toHaveBeenCalled()
  })

  it('refuses expired, exhausted, alternate and finished sessions before inference', async () => {
    for (const mutation of [
      { status: 'REVIEW' as const },
      { captureMode: 'alternative' as const },
      { attemptsUsed: 3 },
      { captureDeadline: new Date(0).toISOString() },
      { expiresAt: new Date(0).toISOString() },
    ]) {
      const h = await prepared()
      await h.sessions.update({ id: h.session.id }, (record) => {
        Object.assign(record.session, mutation)
      })
      await expect(
        h.cases.selfieFramingUseCase.execute(h.session.token, photo(9).bytes),
      ).rejects.toThrow()
      expect(h.engine.framing).not.toHaveBeenCalled()
    }
  })

  it('rechecks the deadline and token after slow inference without saving or approving the probe', async () => {
    const h = await prepared()
    h.engine.framing.mockImplementationOnce(async () => {
      h.advance(16 * 60_000)
      return result
    })
    await expect(
      h.cases.selfieFramingUseCase.execute(h.session.token, photo(9).bytes),
    ).rejects.toMatchObject({ code: 'INVALID_CAPTURE_STATE' })
    expect(h.photos.size).toBe(2)
    expect((await h.sessions.read({ id: h.session.id }))?.session.status).toBe('IN_PROGRESS')
    h.advance(-16 * 60_000)
    h.engine.framing.mockImplementationOnce(async () => {
      await h.sessions.update({ id: h.session.id }, (record) => {
        record.session.token = 'rotated'
      })
      return result
    })
    await expect(
      h.cases.selfieFramingUseCase.execute(h.session.token, photo(9).bytes),
    ).rejects.toMatchObject({ code: 'SESSION_NOT_FOUND' })
  })

  it('reports an unavailable detector without accepting a selfie or changing its evidence', async () => {
    const h = await prepared()
    h.engine.framing.mockRejectedValueOnce(new Error('offline'))
    await expect(
      h.cases.selfieFramingUseCase.execute(h.session.token, photo(9).bytes),
    ).rejects.toMatchObject({ code: 'ANALYSIS_UNAVAILABLE' })
    expect((await h.sessions.read({ id: h.session.id }))?.capture.photos.selfie).toBeUndefined()
  })

  it('discards feedback when the document was replaced during inference', async () => {
    const h = await prepared()
    h.engine.framing.mockImplementationOnce(async () => {
      await h.sessions.update({ id: h.session.id }, (record) => {
        if (record.capture.photos.front) record.capture.photos.front.evidenceId = 'replaced'
      })
      return result
    })
    await expect(
      h.cases.selfieFramingUseCase.execute(h.session.token, photo(9).bytes),
    ).rejects.toMatchObject({ code: 'INVALID_CAPTURE_STATE' })
    expect(h.photos.size).toBe(2)
  })
})

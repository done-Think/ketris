// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
import { HttpFaceEngine } from '../face-match/http-face-engine'

afterEach(() => vi.restoreAllMocks())

it('authenticates framing requests, bounds timeout and strips native metadata', async () => {
  const timeout = vi.spyOn(AbortSignal, 'timeout')
  const result = { width: 640, height: 360, faceCount: 0, face: null }
  const fetch = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(JSON.stringify({ ...result, experimental: true })))
  const engine = new HttpFaceEngine('http://private-engine', 60_000, 'synthetic-service-token')
  expect(await engine.framing(new Uint8Array([1, 2]))).toEqual(result)
  const [url, request] = fetch.mock.calls[0]
  expect(url).toBe('http://private-engine/framing')
  expect(request).toMatchObject({
    cache: 'no-store',
    method: 'POST',
    headers: { Authorization: 'Bearer synthetic-service-token' },
  })
  expect(JSON.parse(String(request?.body))).toEqual({ image: 'AQI=' })
  expect(request?.signal).toBeInstanceOf(AbortSignal)
  expect(timeout).toHaveBeenCalledWith(2500)
})

it.each([
  { width: 640, height: 360, faceCount: 1, face: null },
  { width: 0, height: 360, faceCount: 0, face: null },
  { width: 640, height: 360, faceCount: 0, face: { x: 0, y: 0, width: 1, height: 1 } },
])('refuses malformed native framing responses: %s', async (result) => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(result)))
  await expect(
    new HttpFaceEngine('http://private-engine').framing(new Uint8Array([1])),
  ).rejects.toMatchObject({ code: 'ANALYSIS_INVALID_RESPONSE' })
})

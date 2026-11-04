// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest'
const callbacks = vi.hoisted(() => [] as (() => Promise<void>)[])
const report = vi.hoisted(() => vi.fn())
vi.mock('next/server', () => ({
  after: (callback: () => Promise<void>) => callbacks.push(callback),
}))
vi.mock('../http/telemetry', () => ({ reportUnexpectedFaceCheckFailure: report }))
import { afterResponseAnalysis } from '../infrastructure/after-response-analysis'
beforeEach(() => {
  callbacks.length = 0
  vi.clearAllMocks()
})

it('registers processing after the response and acknowledges before starting the engine', async () => {
  const task = vi.fn().mockResolvedValue(undefined)
  await afterResponseAnalysis.start(task)
  expect(task).not.toHaveBeenCalled()
  await callbacks[0]()
  expect(task).toHaveBeenCalledOnce()
})
it('reports an interrupted job without failing the acknowledged submission', async () => {
  await afterResponseAnalysis.start(async () => {
    throw new Error('private data')
  })
  await expect(callbacks[0]()).resolves.toBeUndefined()
  expect(report).toHaveBeenCalledWith()
})

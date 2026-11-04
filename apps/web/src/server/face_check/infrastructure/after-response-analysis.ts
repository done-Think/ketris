import { after } from 'next/server'
import type { AnalysisRunner } from '../types/verification.types'
import { reportUnexpectedFaceCheckFailure } from '../http/telemetry'

export const afterResponseAnalysis: AnalysisRunner = {
  start: async (task) => {
    after(async () => {
      try {
        await task()
      } catch {
        // PROCESSING and completed checkpoints stay durable for a later invocation.
        reportUnexpectedFaceCheckFailure()
      }
    })
  },
  idle: async () => {},
}

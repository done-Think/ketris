import { prisma } from '@server/db/prisma'

import type { DatabaseHealthProbe } from '../application/ports/system-health.port'
import type { DatabaseHealth } from '../domain/system-health.entity'

const TIMEOUT_MS = 3_000

export class PrismaDatabaseHealthProbe implements DatabaseHealthProbe {
  async check(): Promise<DatabaseHealth> {
    const startedAt = performance.now()

    try {
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('database health check timed out')), TIMEOUT_MS),
        ),
      ])

      return { status: 'up', latencyMs: Math.round(performance.now() - startedAt) }
    } catch {
      return { status: 'down', latencyMs: null }
    }
  }
}

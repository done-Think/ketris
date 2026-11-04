import { prisma } from '@server/db/prisma'
import { faceCheckContainer } from './container'
import { resolveFaceCheckActor } from './require-face-check-actor'

export async function processPendingFaceCheckAnalyses() {
  const startedAt = Date.now()
  const rows = await prisma.faceCheckSession.findMany({
    where: {
      status: 'PROCESSING',
      OR: [{ leaseId: null }, { leaseExpiresAt: { lte: new Date() } }],
    },
    orderBy: { updatedAt: 'asc' },
    take: 5,
    select: { id: true, tenantId: true, requestedById: true },
  })
  let processed = 0
  let failed = 0
  for (const row of rows) {
    if (Date.now() - startedAt > 25_000) break
    try {
      const actor = await resolveFaceCheckActor({
        userId: row.requestedById,
        tenantId: row.tenantId,
      })
      const container = await faceCheckContainer({ actor })
      await container.analyzeSessionUseCase.execute(row.id)
      processed += 1
    } catch {
      failed += 1
    }
  }
  return { processed, failed }
}

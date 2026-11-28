import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { withErrorHandling } from '@server/shared/http'
import { instagramContainer } from '@server/instagram/container'
import { getInstagramConfig, instagramEnabled } from '@server/instagram/config'
import { safeEqual } from '@server/instagram/infrastructure/token-vault'
import { UnauthorizedError } from '@server/shared/errors'

export const runtime = 'nodejs'
export const maxDuration = 120

// The scheduler may run only once a day, so one call drains every due job, then renews tokens.
const jobsBudgetMs = 60_000
const totalBudgetMs = 90_000

export const GET = withErrorHandling(async (request: NextRequest) => {
  const secret = process.env.CRON_SECRET
  if (!secret || !safeEqual(request.headers.get('authorization') ?? '', `Bearer ${secret}`))
    throw new UnauthorizedError()
  if (!instagramEnabled()) return NextResponse.json({ processed: 0, skipped: true })
  getInstagramConfig()
  const startedAt = Date.now()
  let processed = 0
  // A job that is not finished gets a later nextAttemptAt, so it is not claimed twice in a run.
  while (Date.now() - startedAt < jobsBudgetMs && (await instagramContainer.process.execute()))
    processed++
  for (const connection of await instagramContainer.repository.expiringConnections()) {
    if (Date.now() - startedAt > totalBudgetMs) break
    try {
      await instagramContainer.process.refresh(connection)
    } catch {}
  }
  await instagramContainer.repository.cleanupStates()
  return NextResponse.json({ processed, skipped: false })
})

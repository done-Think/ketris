import type {
  OverviewMetrics,
  OverviewScope,
  TimelineEvent,
  TimelineEventKind,
  VerificationSession,
} from '@server/face_check/types/session.types'

import type { OutcomeBucket } from '../../types/verification.types'
import { dayMs, isDemo } from './session-rules'

const overviewDays = 7

const outcomeBucketByEvent: Partial<Record<TimelineEventKind, OutcomeBucket>> = {
  autoApproved: 'approved',
  autoRedo: 'redo',
  autoReview: 'review',
  alternativeRequested: 'review',
}

const outcomeBucketByDecision: Record<NonNullable<TimelineEvent['decision']>, OutcomeBucket> = {
  approve: 'approved',
  reject: 'rejected',
  redo: 'redo',
}

function outcomeBucketFor(event: TimelineEvent) {
  if (event.kind === 'decision' && event.decision) return outcomeBucketByDecision[event.decision]
  return outcomeBucketByEvent[event.kind]
}

function median(values: number[]) {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2)
}

export function buildOverview(
  allSessions: VerificationSession[],
  now: number,
  scope: OverviewScope,
): OverviewMetrics {
  const sessions = allSessions.filter((session) => isDemo(session) === (scope === 'demo'))
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const firstDay = today.getTime() - (overviewDays - 1) * dayMs
  const daily = Array.from({ length: overviewDays }, (_, index) => ({
    day: new Date(firstDay + index * dayMs).toISOString(),
    approved: 0,
    rejected: 0,
    redo: 0,
    review: 0,
  }))
  const decisionSeconds: number[] = []
  let autoApproved = 0

  for (const session of sessions) {
    let submittedAt: number | null = null
    for (const event of session.timeline) {
      const at = Date.parse(event.at)
      if (event.kind === 'submitted') submittedAt = at
      const bucket = outcomeBucketFor(event)
      const index = Math.floor((at - firstDay) / dayMs)
      if (!bucket || index < 0 || index >= overviewDays) continue
      daily[index][bucket] += 1
      if (event.kind === 'autoApproved') autoApproved += 1
      if (bucket !== 'review' && submittedAt !== null)
        decisionSeconds.push(Math.round((at - submittedAt) / 1000))
    }
  }

  const totals = daily.reduce(
    (sum, point) => ({
      approved: sum.approved + point.approved,
      rejected: sum.rejected + point.rejected,
      redo: sum.redo + point.redo,
    }),
    { approved: 0, rejected: 0, redo: 0 },
  )
  const completed = totals.approved + totals.rejected + totals.redo
  const reviewQueue = sessions
    .filter((session) => session.status === 'REVIEW')
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))

  return {
    completed,
    approved: totals.approved,
    rejected: totals.rejected,
    autoApproved,
    autoApprovalRate: completed ? autoApproved / completed : 0,
    inReview: reviewQueue.length,
    oldestReviewAt: reviewQueue[0]?.updatedAt ?? null,
    medianDecisionSeconds: median(decisionSeconds),
    redoRequests: totals.redo,
    daily,
    reviewQueue: reviewQueue.slice(0, 5),
  }
}

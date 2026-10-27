import type { TeamMemberPace } from '../types/team'

export const AHEAD_PACE_RATIO = 1.1
export const ON_TRACK_PACE_RATIO = 0.8

export function monthElapsedFraction(now: Date, monthStart: Date, monthEnd: Date): number {
  const total = monthEnd.getTime() - monthStart.getTime()
  const elapsed = Math.min(Math.max(now.getTime() - monthStart.getTime(), 0), total)

  return total > 0 ? elapsed / total : 0
}

export function teamMemberPace(
  sales: number,
  goal: number | null,
  elapsedFraction: number,
): TeamMemberPace {
  if (!goal) return { status: 'NO_GOAL', expectedSales: null, goalProgress: null }
  const expectedSales = goal * elapsedFraction
  const goalProgress = Math.round((sales / goal) * 100)
  const status =
    sales >= expectedSales * AHEAD_PACE_RATIO
      ? 'AHEAD'
      : sales >= expectedSales * ON_TRACK_PACE_RATIO
        ? 'ON_TRACK'
        : 'ATTENTION'

  return { status, expectedSales: Math.round(expectedSales * 10) / 10, goalProgress }
}

export function median(values: readonly number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  const value = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2

  return Math.round(value)
}

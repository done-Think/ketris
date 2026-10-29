import { dayBoundsInTimeZone, monthBoundsInTimeZone } from '@server/shared/time-zone-calendar'

import type { DashboardPeriods } from '../types/dashboard-overview'

export function buildDashboardPeriods(now: Date): DashboardPeriods {
  return {
    now,
    today: dayBoundsInTimeZone(now),
    month: monthBoundsInTimeZone(now),
  }
}

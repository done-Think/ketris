import type { OverviewScope, SessionListQuery } from '../types'

export const consoleKeys = {
  sessions: ['face_check', 'console', 'sessions'] as const,
  sessionList: (query: SessionListQuery) =>
    ['face_check', 'console', 'sessions', 'list', query] as const,
  session: (id: string) => ['face_check', 'console', 'sessions', 'detail', id] as const,
  overview: ['face_check', 'console', 'overview'] as const,
  overviewScope: (scope: OverviewScope) => ['face_check', 'console', 'overview', scope] as const,
  settings: ['face_check', 'console', 'settings'] as const,
}

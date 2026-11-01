import type { SessionFilter } from '../types'

import type { ReadableSearchParams, SessionListParams } from '../types/console.types'

export const sessionFilters: SessionFilter[] = [
  'all',
  'review',
  'open',
  'redo',
  'approved',
  'rejected',
  'closed',
]

export const sessionsPageSize = 10

export function parseSessionListParams(params: ReadableSearchParams): SessionListParams {
  const filter = params.get('filter')
  const page = Number(params.get('page'))

  return {
    filter: sessionFilters.includes(filter as SessionFilter) ? (filter as SessionFilter) : 'all',
    search: params.get('q') ?? '',
    page: Number.isInteger(page) && page > 0 ? page - 1 : 0,
  }
}

export function serializeSessionListParams(params: SessionListParams): string {
  const query = new URLSearchParams()
  if (params.filter !== 'all') query.set('filter', params.filter)
  if (params.search) query.set('q', params.search)
  if (params.page > 0) query.set('page', String(params.page + 1))
  const text = query.toString()

  return text ? `?${text}` : ''
}

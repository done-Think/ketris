import type { ErrorTrackingProvider } from '../application/ports/system-health.port'
import type { ErrorTrackingHealth, ErrorTrackingIssue } from '../types/system-health'
import type { SentryIssueResponse } from '../types/sentry-error-tracking'

const TIMEOUT_MS = 5_000
const ISSUES_LIMIT = 10
const CACHE_TTL_MS = 60_000

function countLast24h(issue: SentryIssueResponse): number {
  const series = issue.stats?.['24h']
  if (!Array.isArray(series)) return 0

  return series.reduce((total: number, point: unknown) => {
    const events = Array.isArray(point) ? Number(point[1]) : 0
    return Number.isFinite(events) ? total + events : total
  }, 0)
}

function toIssue(issue: SentryIssueResponse): ErrorTrackingIssue | null {
  if (
    typeof issue.id !== 'string' ||
    typeof issue.title !== 'string' ||
    typeof issue.lastSeen !== 'string' ||
    typeof issue.permalink !== 'string'
  ) {
    return null
  }

  return {
    id: issue.id,
    title: issue.title,
    level: typeof issue.level === 'string' ? issue.level : 'error',
    eventsCount: countLast24h(issue),
    lastSeen: new Date(issue.lastSeen),
    permalink: issue.permalink,
  }
}

export class SentryErrorTrackingProvider implements ErrorTrackingProvider {
  private cached: { value: ErrorTrackingHealth; expiresAt: number } | null = null

  constructor(
    private readonly config = {
      apiUrl: process.env.SENTRY_API_URL || 'https://sentry.io',
      organization: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      token: process.env.SENTRY_API_TOKEN,
    },
    private readonly fetcher: typeof fetch = fetch,
    private readonly now: () => number = Date.now,
  ) {}

  async getRecentIssues(): Promise<ErrorTrackingHealth> {
    const { organization, project, token } = this.config
    if (!organization || !project || !token) return { configured: false }

    if (this.cached && this.cached.expiresAt > this.now()) return this.cached.value

    const value = await this.fetchRecentIssues()
    if (value.configured && value.available) {
      this.cached = { value, expiresAt: this.now() + CACHE_TTL_MS }
    }

    return value
  }

  private async fetchRecentIssues(): Promise<ErrorTrackingHealth> {
    const { apiUrl, organization = '', project = '', token } = this.config

    const url = new URL(
      `/api/0/projects/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/issues/`,
      apiUrl,
    )
    url.search = new URLSearchParams({
      query: 'is:unresolved lastSeen:-24h',
      statsPeriod: '24h',
      limit: String(ISSUES_LIMIT),
    }).toString()

    try {
      const response = await this.fetcher(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: 'no-store',
      })
      if (!response.ok) return { configured: true, available: false }

      const body: unknown = await response.json()
      if (!Array.isArray(body)) return { configured: true, available: false }

      const issues = body
        .map((issue) => toIssue(issue as SentryIssueResponse))
        .filter((issue): issue is ErrorTrackingIssue => issue !== null)

      return { configured: true, available: true, issues }
    } catch {
      return { configured: true, available: false }
    }
  }
}

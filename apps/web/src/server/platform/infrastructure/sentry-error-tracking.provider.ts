import type { ErrorTrackingProvider } from '../application/ports/system-health.port'
import type { ErrorTrackingHealth, ErrorTrackingIssue } from '../domain/system-health.entity'

const TIMEOUT_MS = 5_000
const ISSUES_LIMIT = 10

interface SentryIssueResponse {
  id?: unknown
  title?: unknown
  level?: unknown
  count?: unknown
  lastSeen?: unknown
  permalink?: unknown
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

  const eventsCount = Number(issue.count)

  return {
    id: issue.id,
    title: issue.title,
    level: typeof issue.level === 'string' ? issue.level : 'error',
    eventsCount: Number.isFinite(eventsCount) ? eventsCount : 0,
    lastSeen: new Date(issue.lastSeen),
    permalink: issue.permalink,
  }
}

// Reads the project's unresolved issues of the last 24h through the Sentry web API. Needs a token
// with the event:read scope (SENTRY_API_TOKEN), separate from the build-time SENTRY_AUTH_TOKEN.
export class SentryErrorTrackingProvider implements ErrorTrackingProvider {
  constructor(
    private readonly config = {
      apiUrl: process.env.SENTRY_API_URL || 'https://sentry.io',
      organization: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      token: process.env.SENTRY_API_TOKEN,
    },
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async getRecentIssues(): Promise<ErrorTrackingHealth> {
    const { apiUrl, organization, project, token } = this.config
    if (!organization || !project || !token) return { configured: false }

    const url = new URL(
      `/api/0/projects/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/issues/`,
      apiUrl,
    )
    url.search = new URLSearchParams({
      query: 'is:unresolved',
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

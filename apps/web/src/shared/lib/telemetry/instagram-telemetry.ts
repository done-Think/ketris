import type { InstagramTelemetryFilters, PrivacyFilter } from '@shared/types/instagram-telemetry'

const filtered = '[Filtered]'
const maxDepth = 20

function normalizeKey(key: string): string {
  try {
    return decodeURIComponent(key)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
  } catch {
    return key.toLowerCase().replace(/[^a-z0-9]/g, '')
  }
}

function isSensitiveKey(key: string): boolean {
  const normalized = normalizeKey(key)
  return (
    ['code', 'state', 'vars', 'localvariables', 'querystring', 'body'].includes(normalized) ||
    /token|secret|password|passwd|authorization|cookie|verifier|encryptionkey|signature|signedrequest|receipt|credentials|apikey|accesskey/.test(
      normalized,
    )
  )
}

function containsInstagram(value: unknown, seen = new WeakSet<object>(), depth = 0): boolean {
  if (typeof value === 'string') return /instagram/i.test(value)
  if (!value || typeof value !== 'object' || seen.has(value) || depth > maxDepth) return false
  seen.add(value)
  return Object.entries(value).some(
    ([key, entry]) => /instagram/i.test(key) || containsInstagram(entry, seen, depth + 1),
  )
}

function sanitizeText(value: string): string {
  return value
    .replace(/(?:https?:\/\/|\/(?:api|pt|en|es)\/)[^\s"'<>]+/gi, (url) =>
      url.split(/[?#]/, 1)[0].replace(/^(https?:\/\/)[^/]*@/i, '$1'),
    )
    .replace(
      /\b(Authorization|Proxy-Authorization|Cookie|Set-Cookie)\s*:[^\r\n]*/gi,
      '$1: [Filtered]',
    )
    .replace(/\b(Bearer|Basic)\s+[a-z0-9._~+\/-]+=*/gi, '$1 [Filtered]')
    .replace(
      /(?<![a-z0-9_%.-])(["']?([a-z0-9_%.-]+)["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;&}\]]+)/gi,
      (match, prefix: string, key: string) =>
        isSensitiveKey(key) ? `${prefix}${filtered}` : match,
    )
}

function sanitizeValue(value: unknown, seen: WeakSet<object>, parentKey = '', depth = 0): unknown {
  if (typeof value === 'string') return sanitizeText(value)
  if (!value || typeof value !== 'object') return value
  if (seen.has(value) || depth > maxDepth) return filtered
  if (value instanceof Date) return value
  seen.add(value)
  if (Array.isArray(value)) {
    if (value.length === 2 && typeof value[0] === 'string' && isSensitiveKey(value[0]))
      return [value[0], filtered]
    return value.map((entry) => sanitizeValue(entry, seen, parentKey, depth + 1))
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      isSensitiveKey(key) ||
      (normalizeKey(key) === 'data' &&
        ['request', 'normalizedrequest'].includes(normalizeKey(parentKey)))
        ? filtered
        : sanitizeValue(entry, seen, key, depth + 1),
    ]),
  )
}

export function sanitizeInstagramTelemetry<T>(value: T): T {
  if (!containsInstagram(value)) return value
  return sanitizeValue(value, new WeakSet()) as T
}

function sanitizeAfter<T>(filter: PrivacyFilter<T>): PrivacyFilter<T> {
  return (item) => {
    const kept = filter(item)
    return kept === null ? null : sanitizeInstagramTelemetry(kept)
  }
}

// Each runtime already drops Face Check data with its own filters. Run them first, then remove
// Instagram secrets from what is left, so neither filter replaces the other.
export function withInstagramTelemetry<Event, Transaction, Breadcrumb, Log>(
  filters: InstagramTelemetryFilters<Event, Transaction, Breadcrumb, Log>,
) {
  return {
    beforeSend: sanitizeAfter(filters.beforeSend),
    beforeSendTransaction: sanitizeAfter(filters.beforeSendTransaction),
    beforeSendSpan: sanitizeInstagramTelemetry,
    beforeBreadcrumb: sanitizeAfter(filters.beforeBreadcrumb),
    beforeSendLog: sanitizeAfter(filters.beforeSendLog),
  }
}

import { getPathname } from '@/i18n/navigation'
import { resolveRequestLocale } from '@server/shared/http/request-locale'
import { FaceCheckError } from './errors'

function isLoopbackHostname(hostname: string) {
  return (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '[::1]' ||
    /^127(?:\.\d{1,3}){3}$/.test(hostname)
  )
}

function allowsIsolatedE2ECaptureOrigin(origin: URL) {
  if (process.env.KETRIS_E2E_ISOLATED_DB !== '1' || !isLoopbackHostname(origin.hostname))
    return false
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) return false
  try {
    const database = new URL(connectionString)
    if (
      !['postgres:', 'postgresql:'].includes(database.protocol) ||
      !isLoopbackHostname(database.hostname)
    )
      return false
    // Do not allow a query parameter to override the checked connection host/database.
    if (
      ['host', 'hostaddr', 'service', 'dbname', 'database'].some((key) =>
        database.searchParams.has(key),
      )
    )
      return false
    const name = decodeURIComponent(database.pathname.slice(1))
    return (
      /^ketris_[a-z0-9_]+$/.test(name) ||
      (name === 'ketris' && ['true', '1'].includes(process.env.CI?.toLowerCase() ?? ''))
    )
  } catch {
    return false
  }
}

export function buildCaptureUrl(request: Request, token: string) {
  const configured = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL
  if (!configured) throw new FaceCheckError('STORAGE_UNAVAILABLE', 503)
  let origin: URL
  try {
    origin = new URL(configured)
  } catch {
    throw new FaceCheckError('STORAGE_UNAVAILABLE', 503)
  }
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password)
    throw new FaceCheckError('STORAGE_UNAVAILABLE', 503)
  if (
    process.env.NODE_ENV === 'production' &&
    (origin.protocol !== 'https:' || isLoopbackHostname(origin.hostname)) &&
    !allowsIsolatedE2ECaptureOrigin(origin)
  )
    throw new FaceCheckError('STORAGE_UNAVAILABLE', 503)
  const pathname = getPathname({
    locale: resolveRequestLocale(request),
    href: { pathname: '/face_check/verify/[token]', params: { token } },
  })
  return new URL(pathname, origin.origin).toString()
}

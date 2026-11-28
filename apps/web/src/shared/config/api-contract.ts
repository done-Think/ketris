export const API_CONTRACT_VERSION = '3'
export const API_CONTRACT_HEADER = 'X-Ketris-Api-Version'

export function requiresApiContract(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '')
  return !(
    path === '/api/docs' ||
    path.startsWith('/api/docs/') ||
    path === '/api/platform/system/health' ||
    path === '/api/internal/face_check/cleanup' ||
    path === '/api/cron/instagram' ||
    /^\/api\/auth\/(csrf|providers|session|signin|signout|callback|error|verify-request)(\/|$)/.test(
      path,
    ) ||
    /^\/api\/(auth|maintenance|marketplace|properties)\/media\//.test(path) ||
    // Meta and the browser returning from Meta call these without the app's HTTP client.
    /^\/api\/instagram\/(oauth\/callback|deauthorize|data-deletion|deletion-status)$/.test(path) ||
    path.startsWith('/api/instagram/media/')
  )
}

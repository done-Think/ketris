export const API_CONTRACT_VERSION = '2'
export const API_CONTRACT_HEADER = 'X-Ketris-Api-Version'

export function requiresApiContract(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '')
  return !(
    path === '/api/docs' ||
    path.startsWith('/api/docs/') ||
    path === '/api/platform/system/health' ||
    /^\/api\/auth\/(csrf|providers|session|signin|signout|callback|error|verify-request)(\/|$)/.test(
      path,
    ) ||
    /^\/api\/(auth|maintenance|marketplace|properties)\/media\//.test(path)
  )
}

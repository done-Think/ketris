export const publicProfileHandlePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const reservedHandles = new Set([
  'admin',
  'administrator',
  'api',
  'auth',
  'contato',
  'help',
  'ketris',
  'login',
  'platform',
  'register',
  'root',
  'suporte',
  'support',
  'system',
])

export function normalizePublicProfileHandle(value: string) {
  return value.trim().toLowerCase()
}
export function isValidPublicProfileHandle(value: string) {
  return value.length >= 3 && value.length <= 40 && publicProfileHandlePattern.test(value)
}
export function isReservedPublicProfileHandle(value: string) {
  return reservedHandles.has(value)
}
export function buildPublicProfileAddress(handle: string) {
  return `/@${handle}`
}

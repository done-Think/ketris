export const MAX_NEW_PASSWORD_BYTES = 72

export function isSupportedNewPasswordLength(password: string): boolean {
  return (
    password.length <= MAX_NEW_PASSWORD_BYTES &&
    new TextEncoder().encode(password).length <= MAX_NEW_PASSWORD_BYTES
  )
}

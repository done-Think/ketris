export function captureProtocol(token: string) {
  return token.replace(/-/g, '').slice(0, 8).toUpperCase()
}

export const captureKeys = {
  all: (token: string) => ['face_check', 'capture', token] as const,
  session: (token: string) => ['face_check', 'capture', token, 'session'] as const,
  challenges: (token: string) => ['face_check', 'capture', token, 'challenges'] as const,
  status: (token: string) => ['face_check', 'capture', token, 'status'] as const,
}

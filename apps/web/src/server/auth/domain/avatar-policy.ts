import { AvatarValidationError } from './errors'

export function assertAvatarScope(
  url: string | null,
  tenantId: string,
  userId: string,
  currentUrl: string | null,
): void {
  if (url === null || url === currentUrl) return
  const prefix = `/api/auth/media/avatars/${tenantId}/${userId}/`
  const filename = url.startsWith(prefix) ? url.slice(prefix.length) : ''
  if (!filename || filename === '.' || filename === '..' || !/^[a-zA-Z0-9._-]+$/.test(filename))
    throw new AvatarValidationError()
}

import { PropertyMediaValidationError } from './errors'
import type { PropertyMediaInput } from '../types/property'

export function assertPropertyMediaScope(
  tenantId: string,
  media: PropertyMediaInput[] | undefined,
  existingUrls: readonly string[] = [],
): void {
  const existing = new Set(existingUrls)
  const prefix = `/api/properties/media/properties/${tenantId}/`
  for (const item of media ?? []) {
    if (existing.has(item.url)) continue
    const filename = item.url.startsWith(prefix) ? item.url.slice(prefix.length) : ''
    if (!filename || filename === '.' || filename === '..' || !/^[a-zA-Z0-9._-]+$/.test(filename)) {
      throw new PropertyMediaValidationError('A mídia deve ser um upload do mesmo tenant.')
    }
  }
}

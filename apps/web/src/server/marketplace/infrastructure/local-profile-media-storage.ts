import { randomUUID } from 'node:crypto'

import {
  getContentTypeFromMediaKey,
  readLocalUpload,
  writeLocalUpload,
} from '@server/shared/storage/local-media-storage'

import type { ProfileMediaStoragePort } from '../application/ports/profile-media-storage.port'
import type {
  StoredProfileMedia,
  UploadedProfileMedia,
  UploadProfileMediaInput,
} from '../types/profile-media'

function sanitizeFilename(filename: string): string {
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_')

  return sanitized.slice(-100)
}

export class LocalProfileMediaStorage implements ProfileMediaStoragePort {
  async upload(input: UploadProfileMediaInput): Promise<UploadedProfileMedia> {
    const key = `${input.keyPrefix}${randomUUID()}-${sanitizeFilename(input.filename)}`

    await writeLocalUpload('marketplace', key, input.body)

    return { url: `/api/marketplace/media/${key}`, contentType: input.contentType }
  }

  async read(objectKey: string): Promise<StoredProfileMedia | null> {
    try {
      const body = await readLocalUpload('marketplace', objectKey)

      return { body, contentType: getContentTypeFromMediaKey(objectKey) }
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return null
      throw error
    }
  }
}

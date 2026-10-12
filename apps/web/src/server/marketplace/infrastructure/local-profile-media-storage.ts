import { randomUUID } from 'node:crypto'

import { writeLocalUpload } from '@server/shared/storage/local-media-storage'

import type {
  ProfileMediaStoragePort,
  UploadedProfileMedia,
  UploadProfileMediaInput,
} from '../application/ports/profile-media-storage.port'

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
}

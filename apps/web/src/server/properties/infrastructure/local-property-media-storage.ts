import { randomUUID } from 'node:crypto'

import { writeLocalUpload } from '@server/shared/storage/local-media-storage'
import { sanitizeUploadFilename } from '@server/shared/storage/sanitize-filename'

import type {
  PropertyMediaStoragePort,
  UploadedPropertyMedia,
  UploadPropertyMediaInput,
} from '../application/ports/property-media-storage.port'
import { propertyMediaStorageError } from './property-media-storage-error'

export class LocalPropertyMediaStorage implements PropertyMediaStoragePort {
  async upload(input: UploadPropertyMediaInput): Promise<UploadedPropertyMedia> {
    const key = `properties/${input.tenantId}/${randomUUID()}-${sanitizeUploadFilename(input.filename)}`
    try {
      await writeLocalUpload('properties', key, input.body)
    } catch (error) {
      throw propertyMediaStorageError(error)
    }
    return { url: `/api/properties/media/${key}`, contentType: input.contentType }
  }
}

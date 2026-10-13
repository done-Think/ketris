import { BaseService } from '@shared/lib/api/base-service'

import type { ProfileMediaTarget, UploadProfileMediaResponse } from '../types/profile-media'

export class ProfileMediaService extends BaseService {
  private readonly path = '/marketplace/profiles/media'

  upload(file: File, target: ProfileMediaTarget): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('target', target)

    return this.http
      .post<UploadProfileMediaResponse>(this.path, formData, {
        headers: { 'Content-Type': undefined },
      })
      .then((data) => data.media.url)
  }
}

export const profileMediaService = new ProfileMediaService()

import { BaseService } from '@shared/lib/api/base-service'

export type ProfileMediaTarget = 'broker-avatar' | 'broker-banner' | 'agency-logo' | 'agency-banner'

interface UploadProfileMediaResponse {
  media: {
    url: string
    contentType: string
  }
}

export class ProfileMediaService extends BaseService {
  private readonly path = '/marketplace/profiles/media'

  upload(file: File, target: ProfileMediaTarget): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('target', target)

    return this.http
      .post<UploadProfileMediaResponse>(this.path, formData, {
        // O client tem `Content-Type: application/json` fixo como default (ver HttpClient). Um
        // valor explícito aqui travaria em texto puro sem o boundary do multipart — precisa
        // remover o header pra o próprio browser gerar o `multipart/form-data; boundary=...`.
        headers: { 'Content-Type': undefined },
      })
      .then((data) => data.media.url)
  }
}

export const profileMediaService = new ProfileMediaService()

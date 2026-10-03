export type ProfileMediaTarget = 'broker-avatar' | 'broker-banner' | 'agency-logo' | 'agency-banner'

export interface UploadProfileMediaResponse {
  media: {
    url: string
    contentType: string
  }
}

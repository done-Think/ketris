export interface UploadProfileMediaInput {
  keyPrefix: string
  filename: string
  contentType: string
  body: Buffer
}

export interface UploadedProfileMedia {
  url: string
  contentType: string
}

export interface StoredProfileMedia {
  body: Uint8Array
  contentType: string
}

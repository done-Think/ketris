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

export interface ProfileMediaStoragePort {
  upload(input: UploadProfileMediaInput): Promise<UploadedProfileMedia>
}

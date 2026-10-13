export interface UploadPropertyMediaInput {
  tenantId: string
  filename: string
  contentType: string
  body: Buffer
}

export interface UploadedPropertyMedia {
  url: string
  contentType: string
}

export interface PropertyMediaStoragePort {
  upload(input: UploadPropertyMediaInput): Promise<UploadedPropertyMedia>
}

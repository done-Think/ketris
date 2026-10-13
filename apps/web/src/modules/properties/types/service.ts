import type { ApiProperty } from './property'

export interface PropertyResponse {
  property: ApiProperty
}

export interface PropertiesResponse {
  properties: ApiProperty[]
}

export interface UploadPropertyMediaResponse {
  media: {
    url: string
    contentType: string
  }
}

import type { ApiProperty, PropertyPage } from './property'

export interface PropertyResponse {
  property: ApiProperty
}

export interface PropertiesResponse {
  properties: ApiProperty[]
  pagination: PropertyPage['pagination']
  counts: PropertyPage['counts']
}

export interface UploadPropertyMediaResponse {
  media: {
    url: string
    contentType: string
  }
}

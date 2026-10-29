import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { describe, expect, it } from 'vitest'

import { registerPropertiesOpenApi } from '../../openapi'

const registry = new OpenAPIRegistry()
registerPropertiesOpenApi(registry)
const document = new OpenApiGeneratorV3(registry.definitions).generateDocument({
  openapi: '3.0.3',
  info: { title: 'Properties', version: '1.0.0' },
})

describe('property media OpenAPI contract', () => {
  it('documents the authenticated multipart upload and its real response', () => {
    const upload = document.paths['/properties/media']?.post
    expect(upload?.security).toEqual([{ bearerAuth: [] }])
    expect(upload?.requestBody).toMatchObject({
      required: true,
      content: { 'multipart/form-data': expect.anything() },
    })
    expect(Object.keys(upload?.responses ?? {})).toEqual(
      expect.arrayContaining(['201', '400', '401', '403', '503']),
    )
    expect(upload?.responses['503'].description).toContain('PROPERTY_MEDIA_STORAGE_UNAVAILABLE')
    expect(document.components?.schemas?.UploadTenantPropertyMediaResponse).toMatchObject({
      properties: {
        media: {
          properties: {
            url: { type: 'string' },
            contentType: { enum: ['image/jpeg', 'image/png', 'image/webp'] },
          },
        },
      },
    })
  })

  it('documents the public prefix restriction, binary content and missing-image response', () => {
    const read = document.paths['/properties/media/{key}']?.get
    expect(read?.security).toEqual([])
    expect(read?.description).toContain('properties/')
    expect(read?.responses['200']).toMatchObject({ content: { 'image/jpeg': expect.anything() } })
    expect(read?.responses['404']).toBeDefined()
    expect(read?.responses['503']).toBeDefined()
  })
})

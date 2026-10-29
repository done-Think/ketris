import { describe, expect, it } from 'vitest'
import { generateOpenApiDocument } from '../registry'

describe('English HTTP contract', () => {
  it('publishes canonical English opportunity actions', () => {
    expect(generateOpenApiDocument().components?.schemas?.OpportunityResponseAction).toMatchObject({
      type: 'string',
      enum: ['ACCEPT', 'REJECT', 'REQUEST_INFORMATION'],
    })
  })
  it('publishes the current property fields, enum values and version requirement', () => {
    const document = generateOpenApiDocument()
    expect(document.info.version).toBe('3.0.0')
    expect(document.components?.schemas?.TenantProperty).toMatchObject({
      properties: {
        title: { type: 'string' },
        purpose: { enum: ['RENT', 'SALE', 'BOTH'] },
        values: { $ref: '#/components/schemas/TenantPropertyValues' },
      },
    })
    expect(document.components?.schemas?.TenantPropertyValues).toMatchObject({
      properties: { price: { type: 'number' }, propertyTax: { type: 'number', nullable: true } },
    })
    expect(document.paths['/properties']?.post?.parameters).toContainEqual(
      expect.objectContaining({
        in: 'header',
        name: 'X-Ketris-Api-Version',
        required: true,
        schema: { type: 'string', enum: ['3'] },
      }),
    )
  })
})

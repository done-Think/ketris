import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { parseQuery, parseRouteParams, RequestValidationError } from '../../http'

const schema = z.object({ page: z.coerce.number().int().positive().default(1) })

describe('request input parsers', () => {
  it('parses query parameters using the schema, including defaults and coercion', () => {
    expect(parseQuery(new NextRequest('http://localhost/api/test?page=2'), schema)).toEqual({
      page: 2,
    })
    expect(parseQuery(new NextRequest('http://localhost/api/test'), schema)).toEqual({ page: 1 })
  })

  it('reports the same validation error and issue paths as JSON body parsing', () => {
    expect(() =>
      parseQuery(new NextRequest('http://localhost/api/test?page=invalid'), schema),
    ).toThrow(RequestValidationError)
    try {
      parseQuery(new NextRequest('http://localhost/api/test?page=0'), schema)
    } catch (error) {
      expect(error).toMatchObject({
        status: 400,
        code: 'VALIDATION_ERROR',
        issues: [expect.objectContaining({ path: 'page' })],
      })
    }
  })

  it('validates asynchronous route parameters', async () => {
    const idSchema = z.object({ id: z.string().min(1) })
    await expect(
      parseRouteParams(Promise.resolve({ id: 'property-1' }), idSchema),
    ).resolves.toEqual({ id: 'property-1' })
    await expect(parseRouteParams(Promise.resolve({ id: '' }), idSchema)).rejects.toBeInstanceOf(
      RequestValidationError,
    )
    await expect(parseRouteParams(Promise.resolve({}), idSchema)).rejects.toMatchObject({
      issues: [expect.objectContaining({ path: 'id' })],
    })
  })
})

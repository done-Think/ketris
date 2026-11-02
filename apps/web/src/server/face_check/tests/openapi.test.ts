import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { expect, it } from 'vitest'
import { registerFaceCheckOpenApi } from '../openapi'

function routes(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name)
    return entry.isDirectory() ? routes(file) : entry.name === 'route.ts' ? [file] : []
  })
}

it('documents every real Face Check method, including capture and private evidence', () => {
  const registry = new OpenAPIRegistry()
  registerFaceCheckOpenApi(registry)
  const document = new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.0',
    info: { title: 'Face Check', version: '1' },
  })
  const directory = join(process.cwd(), 'src/app/api/face_check')
  for (const file of routes(directory)) {
    const path = `/face_check/${relative(directory, file)
      .split(sep)
      .join('/')
      .replace(/\/route\.ts$/, '')
      .replace(/\[(\w+)\]/g, '{$1}')}`
    for (const [, method] of readFileSync(file, 'utf8').matchAll(
      /export const (GET|POST|PUT|PATCH|DELETE)\b/g,
    )) {
      expect(document.paths, `${method} ${path}`).toHaveProperty([path, method.toLowerCase()])
    }
  }
  expect(document.paths['/face_check/sessions/{id}/evidence/{kind}']?.get?.security).toEqual([
    { bearerAuth: [] },
  ])
  expect(document.paths).not.toHaveProperty('/face_check/demo')
  expect(document.paths).not.toHaveProperty('/face_check/compare')
})

import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { expect, it } from 'vitest'
import { registerMarketplaceOpenApi } from '../openapi'

function routeFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return entry.name === 'tests' ? [] : routeFiles(path)
    return entry.name === 'route.ts' ? [path] : []
  })
}

function generateDocument() {
  const registry = new OpenAPIRegistry()
  registerMarketplaceOpenApi(registry)
  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.0',
    info: { title: 'Marketplace', version: '1' },
  })
}

it('documenta cada método HTTP real do Marketplace, incluindo as rotas de mídia', () => {
  const document = generateDocument()
  const directory = join(process.cwd(), 'src/app/api/marketplace')
  for (const file of routeFiles(directory)) {
    const path = `/marketplace/${relative(directory, file)
      .split(sep)
      .join('/')
      .replace(/\/route\.ts$/, '')
      .replace(/\[(?:\.\.\.)?(\w+)\]/g, '{$1}')}`
    for (const [, method] of readFileSync(file, 'utf8').matchAll(
      /export const (GET|POST|PATCH|DELETE|PUT)\b/g,
    ))
      expect(document.paths, `${method} ${path}`).toHaveProperty([path, method.toLowerCase()])
  }
})

it('documenta a paginação da busca pública e o upload multipart de mídia', () => {
  const document = generateDocument()
  expect(document.paths['/marketplace/properties']?.get?.parameters).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'page', in: 'query' }),
      expect.objectContaining({ name: 'pageSize', in: 'query' }),
    ]),
  )
  expect(document.paths['/marketplace/profiles/media']?.post?.requestBody).toMatchObject({
    required: true,
    content: { 'multipart/form-data': expect.anything() },
  })
})

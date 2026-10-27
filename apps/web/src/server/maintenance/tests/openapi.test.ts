import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { expect, it } from 'vitest'
import { registerMaintenanceOpenApi } from '../openapi'

function routeFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return entry.name === 'tests' ? [] : routeFiles(path)
    return entry.name === 'route.ts' ? [path] : []
  })
}

function generateDocument() {
  const registry = new OpenAPIRegistry()
  registerMaintenanceOpenApi(registry)
  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.0',
    info: { title: 'Maintenance', version: '1' },
  })
}

it('documents every Maintenance HTTP route, including providers and direct uploads', () => {
  const document = generateDocument()
  const directory = join(process.cwd(), 'src/app/api/maintenance')
  for (const file of routeFiles(directory)) {
    const path = `/maintenance/${relative(directory, file)
      .split(sep)
      .join('/')
      .replace(/\/route\.ts$/, '')
      .replace(/\[(?:\.\.\.)?(\w+)\]/g, '{$1}')}`
    for (const [, method] of readFileSync(file, 'utf8').matchAll(
      /export const (GET|POST|PATCH|DELETE|PUT)\b/g,
    )) {
      expect(document.paths[path], `${method} ${path}`).toHaveProperty(method.toLowerCase())
    }
  }
})

it('documents category filtering, private redirects and an optional resolution body', () => {
  const document = generateDocument()
  expect(document.paths['/maintenance/media/{key}']?.get?.responses).toHaveProperty('302')
  expect(document.paths['/maintenance/tickets/{id}/resolve']?.post?.requestBody).toMatchObject({
    required: false,
  })
  expect(document.paths['/maintenance/tickets']?.get?.parameters).toEqual(
    expect.arrayContaining([expect.objectContaining({ name: 'category', in: 'query' })]),
  )
})

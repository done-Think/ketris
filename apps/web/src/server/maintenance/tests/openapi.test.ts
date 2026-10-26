import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
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

it('documenta cada método HTTP real de Manutenção, incluindo anexos e mídia privada', () => {
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
    ))
      expect(document.paths[path], `${method} ${path}`).toHaveProperty(method.toLowerCase())
  }
})

it('documenta o upload multipart, o filtro de categoria e o resolve sem corpo', () => {
  const document = generateDocument()
  expect(document.paths['/maintenance/tickets/{id}/attachments']?.post?.requestBody).toMatchObject({
    required: true,
    content: { 'multipart/form-data': expect.anything() },
  })
  expect(document.paths['/maintenance/tickets/{id}/resolve']?.post?.requestBody).toBeUndefined()
  expect(document.paths['/maintenance/tickets']?.get?.parameters).toEqual(
    expect.arrayContaining([expect.objectContaining({ name: 'category', in: 'query' })]),
  )
})

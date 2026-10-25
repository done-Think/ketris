import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { expect, it } from 'vitest'
import { registerAgendaOpenApi } from '../openapi'

function routeFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? routeFiles(path) : entry.name === 'route.ts' ? [path] : []
  })
}
it('documenta cada método HTTP real de Agenda, incluindo a busca de imóveis e o motivo obrigatório', () => {
  const registry = new OpenAPIRegistry()
  registerAgendaOpenApi(registry)
  const document = new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.0',
    info: { title: 'Agenda', version: '1' },
  })
  const directory = join(process.cwd(), 'src/app/api/agenda')
  for (const file of routeFiles(directory)) {
    const path = `/agenda/${relative(directory, file)
      .replace(/\/route\.ts$/, '')
      .replace(/\[(\w+)\]/g, '{$1}')}`
    for (const [, method] of readFileSync(file, 'utf8').matchAll(
      /export const (GET|POST|PATCH|DELETE|PUT)\b/g,
    ))
      expect(document.paths[path], `${method} ${path}`).toHaveProperty(method.toLowerCase())
  }
  expect(document.paths['/agenda/events/{id}/cancel']?.post?.requestBody).toMatchObject({
    required: true,
  })
})

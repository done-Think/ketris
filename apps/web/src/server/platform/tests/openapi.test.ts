import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { expect, it } from 'vitest'

import { registerPlatformOpenApi } from '../openapi'

function routeFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return entry.name === 'tests' ? [] : routeFiles(path)
    return entry.name === 'route.ts' ? [path] : []
  })
}

function generateDocument() {
  const registry = new OpenAPIRegistry()
  registerPlatformOpenApi(registry)
  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.0',
    info: { title: 'Platform', version: '1' },
  })
}

const undocumented = new Set(['POST /platform/admins', 'POST /platform/tenants/{id}/admins'])

it('documenta cada método HTTP real da plataforma, exceto a criação de admins', () => {
  const document = generateDocument()
  const directory = join(process.cwd(), 'src/app/api/platform')
  for (const file of routeFiles(directory)) {
    const path = `/platform/${relative(directory, file)
      .split(sep)
      .join('/')
      .replace(/\/route\.ts$/, '')
      .replace(/\[(?:\.\.\.)?(\w+)\]/g, '{$1}')}`
    for (const [, method] of readFileSync(file, 'utf8').matchAll(
      /export const (GET|POST|PATCH|DELETE|PUT)\b/g,
    )) {
      const operation = document.paths[path]?.[method.toLowerCase() as 'get']
      if (undocumented.has(`${method} ${path}`))
        expect(operation, `${method} ${path}`).toBeUndefined()
      else expect(operation, `${method} ${path}`).toBeDefined()
    }
  }
})

it('documenta a paginação das listas e o 403 das ações restritas ao papel ADMIN', () => {
  const document = generateDocument()
  const tenantsQuery = document.paths['/platform/tenants'].get?.parameters?.map((parameter) =>
    'name' in parameter ? parameter.name : null,
  )
  const usersQuery = document.paths['/platform/tenants/{id}/users'].get?.parameters?.map(
    (parameter) => ('name' in parameter ? parameter.name : null),
  )

  expect(tenantsQuery).toEqual(
    expect.arrayContaining(['q', 'status', 'accountType', 'page', 'pageSize']),
  )
  expect(usersQuery).toEqual(expect.arrayContaining(['id', 'page', 'pageSize']))
  for (const [path, method] of [
    ['/platform/admins/{id}', 'patch'],
    ['/platform/admins/{id}', 'delete'],
    ['/platform/tenants', 'post'],
  ] as const)
    expect(document.paths[path][method]?.responses, `${method} ${path}`).toHaveProperty('403')
})

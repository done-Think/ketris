import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { describe, expect, it } from 'vitest'

import { registerAuthOpenApi } from '../openapi'

const authRoutesDirectory = join(process.cwd(), 'src/app/api/auth')

function routeFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return routeFiles(path)
    return entry.name === 'route.ts' ? [path] : []
  })
}

function authDocument() {
  const registry = new OpenAPIRegistry()
  registerAuthOpenApi(registry)
  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.0',
    info: { title: 'Auth', version: '1' },
  })
}

describe('Auth OpenAPI', () => {
  it('documenta cada método dos handlers de domínio Auth existentes', () => {
    const document = authDocument()
    const files = routeFiles(authRoutesDirectory).filter((file) => !file.includes('[...nextauth]'))

    for (const file of files) {
      const path = `/auth/${relative(authRoutesDirectory, file)
        .split(sep)
        .join('/')
        .replace(/\/route\.ts$/, '')}`
        .replace(/\[\.\.\.(\w+)\]/g, '{$1}')
        .replace(/\[(\w+)\]/g, '{$1}')
      const methods = readFileSync(file, 'utf8').matchAll(
        /export const (GET|POST|PUT|PATCH|DELETE)\b/g,
      )
      for (const [, method] of methods) {
        expect(document.paths[path], `${method} ${path}`).toHaveProperty(method.toLowerCase())
      }
    }
  })

  it('mantém a confirmação de cadastro pública e protege a mudança do próprio e-mail', () => {
    const document = authDocument()
    expect(document.paths['/auth/email-verification-codes/verify']?.post?.security).toEqual([])
    expect(document.paths['/auth/me/email-change/verify']?.post?.security).toEqual([
      { bearerAuth: [] },
    ])
    expect(document.paths['/auth/users/{id}/email-change']?.post?.security).toEqual([
      { bearerAuth: [] },
    ])
    expect(document.paths['/auth/email-change/verify']?.post?.security).toEqual([])
    expect(document.paths['/auth/email-verification-codes/verify']?.post?.responses).toHaveProperty(
      '200',
    )
    expect(document.paths['/auth/me/email-change/verify']?.post?.responses).toHaveProperty('204')
    expect(Object.keys(document.paths).some((path) => path.startsWith('/auth/admins'))).toBe(false)
  })
})

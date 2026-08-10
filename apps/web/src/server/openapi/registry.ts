import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'

import { registerAuthOpenApi } from '@server/auth/openapi'
import { registerPlatformOpenApi } from '@server/platform/openapi'
import './zod-extend'

export const registry = new OpenAPIRegistry()

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
})

registerAuthOpenApi(registry)
registerPlatformOpenApi(registry)

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions)

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Ketris BFF API',
      version: '0.1.0',
      description:
        'API interna do BFF do Ketris (Next.js Route Handlers). Ver docs/adr/0001-bff-banco-orm.md e ' +
        'docs/adr/0002-arquitetura-interna-bff.md.',
    },
    servers: [{ url: '/api' }],
  })
}

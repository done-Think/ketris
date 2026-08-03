import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'

import { registerAuthOpenApi } from '@server/auth/openapi'
import './zod-extend'

// Registry único, compartilhado por todos os domínios (auth, imoveis, contratos, ...). Cada domínio
// expõe uma função `register<Dominio>OpenApi(registry)` em `src/server/<dominio>/openapi.ts` — recebe o
// registry por parâmetro (em vez de importá-lo como singleton global) para não criar import circular e
// para deixar explícito, aqui, quais módulos já têm documentação registrada.
export const registry = new OpenAPIRegistry()

registerAuthOpenApi(registry)

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
    servers: [{ url: '/api', description: 'BFF (mesmo host do frontend)' }],
  })
}

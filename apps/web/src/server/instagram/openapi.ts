import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { instagramPublicationSchema } from './schemas/publication.schema'

export function registerInstagramOpenApi(registry: OpenAPIRegistry) {
  const publication = z.object({
    id: z.string(),
    propertyId: z.string(),
    accountId: z.string(),
    status: z.enum([
      'QUEUED',
      'PREPARING',
      'READY',
      'PUBLISHING',
      'VERIFYING',
      'PUBLISHED',
      'FAILED',
      'BLOCKED',
      'CANCELLED',
    ]),
    permalink: z.string().nullable(),
    errorCode: z.string().nullable(),
    createdAt: z.string().datetime(),
  })
  const connection = z.object({
    configured: z.boolean(),
    connected: z.boolean(),
    accountId: z.string().optional(),
    username: z.string().optional(),
    expired: z.boolean().optional(),
    expiresAt: z.string().datetime().optional(),
  })
  const propertyParams = z.object({ propertyId: z.string().min(1) })
  const security = [{ bearerAuth: [] }]
  registry.registerPath({
    method: 'get',
    path: '/instagram/connection',
    tags: ['Instagram'],
    summary:
      'Consulta conexão pessoal no tenant; gestor, corretor ou proprietário; nunca retorna token',
    security,
    responses: {
      200: {
        description: 'Estado da conexão',
        content: { 'application/json': { schema: connection } },
      },
    },
  })
  registry.registerPath({
    method: 'delete',
    path: '/instagram/connection',
    tags: ['Instagram'],
    summary:
      'Desconecta a conta local e cancela trabalhos pendentes; gestor, corretor ou proprietário',
    security,
    responses: { 200: { description: 'Desconectado' } },
  })
  registry.registerPath({
    method: 'post',
    path: '/instagram/oauth/start',
    tags: ['Instagram'],
    summary: 'Inicia Instagram Login e emite cookie seguro; gestor, corretor ou proprietário',
    security,
    responses: {
      200: {
        description: 'URL oficial de autorização',
        content: {
          'application/json': { schema: z.object({ authorizationUrl: z.string().url() }) },
        },
      },
    },
  })
  registry.registerPath({
    method: 'get',
    path: '/instagram/properties/{propertyId}/publications',
    tags: ['Instagram'],
    summary:
      'Consulta histórico pessoal do imóvel autorizado no tenant; gestor, corretor ou proprietário',
    security,
    request: { params: propertyParams },
    responses: {
      200: {
        description: 'Publicações',
        content: {
          'application/json': { schema: z.object({ publications: z.array(publication) }) },
        },
      },
    },
  })
  registry.registerPath({
    method: 'post',
    path: '/instagram/properties/{propertyId}/publications',
    tags: ['Instagram'],
    summary:
      'Registra envio após revisão; imóvel precisa estar publicado; gestor, corretor ou proprietário',
    description:
      'Um envio por tenant, imóvel e conta Instagram. A conta pertence ao usuário autenticado, que precisa ter acesso atual ao imóvel. Uma solicitação repetida não produz outro post. Falha externa não altera o imóvel no site.',
    security,
    request: {
      params: propertyParams,
      body: {
        required: true,
        content: { 'application/json': { schema: instagramPublicationSchema } },
      },
    },
    responses: {
      202: {
        description: 'Publicação registrada ou existente',
        content: { 'application/json': { schema: z.object({ publication }) } },
      },
    },
  })
  registry.registerPath({
    method: 'post',
    path: '/instagram/publications/{id}/retry',
    tags: ['Instagram'],
    summary: 'Retenta somente falhas anteriores à confirmação; gestor, corretor ou proprietário',
    description:
      'Somente o solicitante com acesso atual ao imóvel pode tentar novamente. VERIFYING, BLOCKED, PUBLISHING e PUBLISHED não podem ser reenviados por esta rota.',
    security,
    request: { params: z.object({ id: z.string().min(1) }) },
    responses: {
      202: { description: 'Nova tentativa registrada' },
      409: { description: 'Estado não permite tentativa segura' },
    },
  })
}

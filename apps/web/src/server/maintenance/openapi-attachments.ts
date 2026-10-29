import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { maintenanceAttachmentResponseSchema } from './schemas/maintenance-attachment.schema'
import { maintenanceTicketIdParamsSchema } from './schemas/maintenance-ticket.schema'
import {
  maintenanceCompleteUploadRequestSchema,
  maintenancePrepareUploadResponseSchema,
  maintenanceUploadMetadataSchema,
} from './schemas/maintenance-upload.schema'

export function registerMaintenanceAttachmentsOpenApi(registry: OpenAPIRegistry) {
  registry.registerPath({
    method: 'post',
    path: '/maintenance/tickets/{id}/attachments/upload',
    tags: ['Maintenance'],
    summary: 'Autoriza envio direto de imagem privada de até 8 MB',
    description:
      'Exige collaborate no chamado. Retorna URL de PUT e autorização assinada vinculada a usuário, chamado, tenant, nome, tamanho, tipo e SHA-256. Envie ao S3 usando somente os cabeçalhos retornados, sem o token de sessão. A URL expira em 10 minutos. O anexo só aparece após a confirmação.',
    security: [{ bearerAuth: [] }],
    request: {
      params: maintenanceTicketIdParamsSchema,
      body: { content: { 'application/json': { schema: maintenanceUploadMetadataSchema } } },
    },
    responses: {
      200: {
        description: 'Envio autorizado.',
        content: { 'application/json': { schema: maintenancePrepareUploadResponseSchema } },
      },
      400: { description: 'Metadados inválidos.' },
      404: { description: 'Chamado sem acesso.' },
      409: { description: 'Chamado não permite anexos.' },
      503: { description: 'Storage indisponível.' },
    },
  })
  registry.registerPath({
    method: 'post',
    path: '/maintenance/tickets/{id}/attachments/complete',
    tags: ['Maintenance'],
    summary: 'Confirma imagem enviada, revalidando acesso e integridade',
    description:
      'Revalida acesso e colaboração, identidade do autor e chamado da autorização e metadados/tamanho/SHA-256 do objeto no S3. Anexo e atividade são gravados juntos. Repetir uma confirmação já concluída não cria outro registro nem outra atividade.',
    security: [{ bearerAuth: [] }],
    request: {
      params: maintenanceTicketIdParamsSchema,
      body: { content: { 'application/json': { schema: maintenanceCompleteUploadRequestSchema } } },
    },
    responses: {
      201: {
        description: 'Anexo registrado.',
        content: { 'application/json': { schema: maintenanceAttachmentResponseSchema } },
      },
      400: { description: 'Arquivo divergente ou autorização inválida.' },
      404: { description: 'Chamado, tenant ou autor fora do escopo.' },
      409: { description: 'Autorização expirada, chamado encerrado ou alteração concorrente.' },
    },
  })
  registry.registerPath({
    method: 'get',
    path: '/maintenance/media/{key}',
    tags: ['Maintenance'],
    summary: 'Autoriza a leitura de anexo privado por chamado',
    description:
      'Aceita Bearer ou sessão válida. Confere prefixo, vínculo do anexo e acesso atual ao chamado antes de emitir URL temporária de leitura por 60 segundos. Resposta sem cache público. O arquivo é servido pelo S3, sem atravessar o limite de resposta da função.',
    security: [{ bearerAuth: [] }],
    request: { params: z.object({ key: z.string().min(1) }) },
    responses: {
      302: { description: 'Redirecionamento autorizado para leitura privada.' },
      404: { description: 'Arquivo não encontrado ou fora do escopo.' },
      503: { description: 'Storage indisponível.' },
    },
  })
}

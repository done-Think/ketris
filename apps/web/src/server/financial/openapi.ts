import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import type { ZodTypeAny } from 'zod'

import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'

import {
  chargeReasonRequestSchema,
  createChargeRequestSchema,
  exportChargesQuerySchema,
  financialSummaryQuerySchema,
  listChargesQuerySchema,
  registerChargePaymentRequestSchema,
  updateChargeRequestSchema,
} from './schemas/charge-input.schema'
import { initChargeReceiptUploadRequestSchema } from './schemas/charge-receipt.schema'
import {
  chargeHistoryResponseSchema,
  chargeIdParamsSchema,
  chargeReceiptDownloadResponseSchema,
  chargeReceiptParamsSchema,
  chargeReceiptUploadResponseSchema,
  chargeResponseSchema,
  chargesResponseSchema,
  financialSummarySchema,
} from './schemas/charge.schema'

const json = (schema: ZodTypeAny) => ({ 'application/json': { schema } })
const error = (description: string) => ({ description, content: json(errorResponseSchema) })

const unauthorized = error('Access token ausente, inválido ou expirado.')
const ownerOnly = error('Só o dono da imobiliária (OWNER) gerencia o financeiro.')
const notFound = error('Cobrança não encontrada no escopo do usuário.')
const invalidBody = error('Corpo, parâmetros ou query inválidos.')

export function registerFinancialOpenApi(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/financial/charges',
    tags: ['Financial'],
    summary: 'Lista cobranças autorizadas para o usuário autenticado',
    description:
      'OWNER consulta o tenant. PROPERTY_OWNER vê as cobranças dos contratos dos imóveis dele. RENTER vê só A_RECEBER dos contratos em que é LOCATARIO. AGENT recebe 403. O filtro status=ATRASADA traz pendentes e agendadas vencidas; PENDENTE e AGENDADA trazem só as que ainda não venceram.',
    security: [{ bearerAuth: [] }],
    request: { query: listChargesQuerySchema },
    responses: {
      200: { description: 'Página de cobranças.', content: json(chargesResponseSchema) },
      400: invalidBody,
      401: unauthorized,
      403: ownerOnly,
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/financial/charges',
    tags: ['Financial'],
    summary: 'Cria uma cobrança (avulsa ou vinculada a um contrato)',
    description: 'O código COB-AAAA-NNNN é sequencial por tenant. A criação fica no histórico.',
    security: [{ bearerAuth: [] }],
    request: { body: { content: json(createChargeRequestSchema) } },
    responses: {
      201: { description: 'Cobrança criada.', content: json(chargeResponseSchema) },
      400: invalidBody,
      401: unauthorized,
      403: ownerOnly,
      404: error('Contrato não encontrado no tenant.'),
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/financial/charges/{id}',
    tags: ['Financial'],
    summary: 'Detalha uma cobrança no escopo do usuário',
    security: [{ bearerAuth: [] }],
    request: { params: chargeIdParamsSchema },
    responses: {
      200: { description: 'Cobrança.', content: json(chargeResponseSchema) },
      401: unauthorized,
      403: ownerOnly,
      404: notFound,
    },
  })

  registry.registerPath({
    method: 'patch',
    path: '/financial/charges/{id}',
    tags: ['Financial'],
    summary: 'Edita descrição, tipo, valor ou vencimento',
    description:
      'Não troca status (use payment, payment-reversal e cancel). Paga ou cancelada só aceita mudar a descrição. A mudança fica no histórico.',
    security: [{ bearerAuth: [] }],
    request: { params: chargeIdParamsSchema, body: { content: json(updateChargeRequestSchema) } },
    responses: {
      200: { description: 'Cobrança atualizada.', content: json(chargeResponseSchema) },
      400: invalidBody,
      401: unauthorized,
      403: ownerOnly,
      404: notFound,
      409: error('CHARGE_LOCKED ou CHARGE_CONCURRENT_CHANGE.'),
    },
  })

  registry.registerPath({
    method: 'delete',
    path: '/financial/charges/{id}',
    tags: ['Financial'],
    summary: 'Exclui uma cobrança sem movimento',
    description:
      'Só pendente ou agendada que nunca teve pagamento, estorno ou cancelamento. A exclusão fica no histórico.',
    security: [{ bearerAuth: [] }],
    request: { params: chargeIdParamsSchema },
    responses: {
      204: { description: 'Cobrança excluída.' },
      401: unauthorized,
      403: ownerOnly,
      404: notFound,
      409: error('CHARGE_HAS_MOVEMENT ou CHARGE_CONCURRENT_CHANGE.'),
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/financial/charges/{id}/receipt-uploads',
    tags: ['Financial'],
    summary: 'Gera a URL assinada para enviar o comprovante do pagamento',
    description:
      'PDF, JPG ou PNG até 10 MB. O arquivo vai direto para o S3 e o uploadToken é usado em POST /payment.',
    security: [{ bearerAuth: [] }],
    request: {
      params: chargeIdParamsSchema,
      body: { content: json(initChargeReceiptUploadRequestSchema) },
    },
    responses: {
      201: {
        description: 'URL e token de envio.',
        content: json(chargeReceiptUploadResponseSchema),
      },
      400: invalidBody,
      401: unauthorized,
      403: ownerOnly,
      404: notFound,
      409: error('CHARGE_ALREADY_SETTLED.'),
      503: error('CHARGE_RECEIPT_STORAGE_UNAVAILABLE.'),
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/financial/charges/{id}/payment',
    tags: ['Financial'],
    summary: 'Registra o pagamento de uma cobrança pendente, agendada ou atrasada',
    description:
      'Grava quem deu baixa. Com receiptUploadToken, confere tamanho, hash e tipo do arquivo enviado e anexa o comprovante.',
    security: [{ bearerAuth: [] }],
    request: {
      params: chargeIdParamsSchema,
      body: { content: json(registerChargePaymentRequestSchema) },
    },
    responses: {
      200: { description: 'Pagamento registrado.', content: json(chargeResponseSchema) },
      400: invalidBody,
      401: unauthorized,
      403: ownerOnly,
      404: notFound,
      409: error(
        'CHARGE_ALREADY_SETTLED, CHARGE_RECEIPT_UPLOAD_EXPIRED ou CHARGE_CONCURRENT_CHANGE.',
      ),
      422: error('CHARGE_RECEIPT_INVALID.'),
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/financial/charges/{id}/payment-reversal',
    tags: ['Financial'],
    summary: 'Estorna o pagamento (paga volta a pendente)',
    description: 'Motivo obrigatório. O comprovante continua acessível pelo histórico.',
    security: [{ bearerAuth: [] }],
    request: { params: chargeIdParamsSchema, body: { content: json(chargeReasonRequestSchema) } },
    responses: {
      200: { description: 'Pagamento estornado.', content: json(chargeResponseSchema) },
      400: invalidBody,
      401: unauthorized,
      403: ownerOnly,
      404: notFound,
      409: error('CHARGE_NOT_PAID ou CHARGE_CONCURRENT_CHANGE.'),
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/financial/charges/{id}/cancel',
    tags: ['Financial'],
    summary: 'Cancela uma cobrança pendente, agendada ou atrasada',
    description: 'Motivo obrigatório. Cancelada não reabre.',
    security: [{ bearerAuth: [] }],
    request: { params: chargeIdParamsSchema, body: { content: json(chargeReasonRequestSchema) } },
    responses: {
      200: { description: 'Cobrança cancelada.', content: json(chargeResponseSchema) },
      400: invalidBody,
      401: unauthorized,
      403: ownerOnly,
      404: notFound,
      409: error('CHARGE_ALREADY_SETTLED ou CHARGE_CONCURRENT_CHANGE.'),
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/financial/charges/{id}/history',
    tags: ['Financial'],
    summary: 'Histórico de auditoria da cobrança (só OWNER)',
    security: [{ bearerAuth: [] }],
    request: { params: chargeIdParamsSchema },
    responses: {
      200: {
        description: 'Eventos, do mais recente ao mais antigo.',
        content: json(chargeHistoryResponseSchema),
      },
      401: unauthorized,
      403: ownerOnly,
      404: notFound,
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/financial/charges/{id}/receipts/{receiptId}/download',
    tags: ['Financial'],
    summary: 'URL temporária para baixar um comprovante',
    description:
      'Quem vê a cobrança baixa o comprovante vigente. Comprovantes antigos (estornados) só o OWNER, pelo histórico.',
    security: [{ bearerAuth: [] }],
    request: { params: chargeReceiptParamsSchema },
    responses: {
      200: {
        description: 'URL assinada (60 s).',
        content: json(chargeReceiptDownloadResponseSchema),
      },
      401: unauthorized,
      403: ownerOnly,
      404: error('CHARGE_RECEIPT_NOT_FOUND.'),
      422: error('CHARGE_RECEIPT_INVALID.'),
      503: error('CHARGE_RECEIPT_STORAGE_UNAVAILABLE.'),
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/financial/summary',
    tags: ['Financial'],
    summary: 'Resumo financeiro do tenant (só OWNER)',
    description:
      'monthlyReceivable soma A_RECEBER não canceladas com vencimento no mês (month, padrão o atual) e monthlySeries os 6 meses que terminam nele. overdueTotal, defaultRatePercentage, occupancyRatePercentage e upcomingDues são a posição de hoje. Valores em BRL.',
    security: [{ bearerAuth: [] }],
    request: { query: financialSummaryQuerySchema },
    responses: {
      200: { description: 'Resumo.', content: json(financialSummarySchema) },
      401: unauthorized,
      403: ownerOnly,
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/financial/charges/export',
    tags: ['Financial'],
    summary: 'Exporta em CSV as cobranças com vencimento no mês (só OWNER)',
    description:
      'A receber e a pagar. Separador ";", decimal com vírgula, datas DD/MM/AAAA e BOM UTF-8 para abrir no Excel. O locale só muda cabeçalhos e rótulos.',
    security: [{ bearerAuth: [] }],
    request: { query: exportChargesQuerySchema },
    responses: {
      200: {
        description: 'Arquivo CSV.',
        content: { 'text/csv': { schema: { type: 'string' } } },
      },
      400: invalidBody,
      401: unauthorized,
      403: ownerOnly,
    },
  })
}

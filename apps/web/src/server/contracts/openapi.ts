import {
  initContractDocumentRequestSchema,
  confirmContractDocumentRequestSchema,
  contractDocumentUploadResponseSchema,
  contractDocumentResponseSchema,
  contractDocumentParamsSchema,
  contractDocumentDownloadResponseSchema,
} from './schemas/contract-document.schema'
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import {
  editContractRequestSchema,
  transitionContractRequestSchema,
  signContractPartyRequestSchema,
  contractHistoryQuerySchema,
  contractHistoryResponseSchema,
} from './schemas/contract-workflow.schema'
import {
  contractOpportunitiesResponseSchema,
  listContractOpportunitiesQuerySchema,
} from './schemas/contract-opportunity.schema'
import { errorResponseSchema } from '@server/shared/schemas/error-response.schema'
import {
  createContractRequestSchema,
  listContractsQuerySchema,
  linkContractPartyUserRequestSchema,
} from './schemas/contract-input.schema'
import {
  contractIdParamsSchema,
  contractPartyIdParamsSchema,
  contractResponseSchema,
  contractPartyUserLinkSchema,
  contractsResponseSchema,
} from './schemas/contract.schema'

export function registerContractsOpenApi(registry: OpenAPIRegistry): void {
  const mutationResponses = {
    200: {
      description: 'Contrato atualizado com histórico transacional.',
      content: { 'application/json': { schema: contractResponseSchema } },
    },
    400: {
      description: 'Entrada inválida.',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    401: {
      description: 'Autenticação ausente ou inválida.',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    403: {
      description: 'O perfil não pode gerenciar contratos.',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Contrato não encontrado no escopo autorizado.',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    409: {
      description: 'Estado do contrato ou assinaturas impedem a operação.',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  }
  const documentErrors = {
    400: {
      description: 'Metadados inválidos ou conteúdo incompatível com o PDF autorizado.',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    401: mutationResponses[401],
    403: mutationResponses[403],
    404: mutationResponses[404],
    409: {
      description: 'Autorização expirada ou dados do contrato alterados após o início do envio.',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    503: {
      description: 'Serviço de documentos indisponível.',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  }
  registry.registerPath({
    method: 'post',
    path: '/contracts/{id}/documents/uploads',
    tags: ['Contracts'],
    summary: 'Autoriza o envio direto de PDF privado',
    description:
      'Somente quem pode gerenciar o contrato. Aceita PDF de até 10 MiB. Vincula tamanho, SHA-256, ator e revisão do contrato à autorização temporária de dez minutos. O navegador envia o arquivo diretamente ao storage com os cabeçalhos retornados; esta chamada não recebe o arquivo.',
    security: [{ bearerAuth: [] }],
    request: {
      params: contractIdParamsSchema,
      body: { content: { 'application/json': { schema: initContractDocumentRequestSchema } } },
    },
    responses: {
      ...documentErrors,
      200: {
        description: 'URL temporária, cabeçalhos obrigatórios e token para confirmação.',
        content: { 'application/json': { schema: contractDocumentUploadResponseSchema } },
      },
    },
  })
  registry.registerPath({
    method: 'post',
    path: '/contracts/{id}/documents',
    tags: ['Contracts'],
    summary: 'Confirma e registra um PDF enviado',
    description:
      'Revalida acesso, autoria, revisão atual, tamanho, tipo, cabeçalho PDF e hash do arquivo no storage. Registra documento e histórico na mesma transação. Repetir a confirmação do mesmo envio não duplica o documento nem o histórico.',
    security: [{ bearerAuth: [] }],
    request: {
      params: contractIdParamsSchema,
      body: { content: { 'application/json': { schema: confirmContractDocumentRequestSchema } } },
    },
    responses: {
      ...documentErrors,
      200: {
        description: 'Documento privado registrado, sem expor sua chave de storage.',
        content: { 'application/json': { schema: contractDocumentResponseSchema } },
      },
    },
  })
  registry.registerPath({
    method: 'get',
    path: '/contracts/{id}/documents/{documentId}/download',
    tags: ['Contracts'],
    summary: 'Autoriza o download privado de PDF',
    description:
      'Aplica as mesmas permissões de leitura do contrato, inclusive vínculo do locatário. Confere a integridade antes de emitir uma URL de download válida por um minuto. Documentos legados sem arquivo privado comprovado permanecem no histórico e não geram uma URL.',
    security: [{ bearerAuth: [] }],
    request: { params: contractDocumentParamsSchema },
    responses: {
      ...documentErrors,
      200: {
        description: 'URL temporária de download, com resposta sem cache.',
        content: { 'application/json': { schema: contractDocumentDownloadResponseSchema } },
      },
    },
  })
  registry.registerPath({
    method: 'patch',
    path: '/contracts/{id}',
    tags: ['Contracts'],
    summary: 'Edita o contrato antes da primeira assinatura',
    description:
      'Permite alterar partes e condições antes da primeira assinatura. Proposta, imóvel e código permanecem fixos. Alterar o e-mail da parte locatária remove seu vínculo anterior; mudanças nos dados exigem novo PDF para registrar assinaturas.',
    security: [{ bearerAuth: [] }],
    request: {
      params: contractIdParamsSchema,
      body: { content: { 'application/json': { schema: editContractRequestSchema } } },
    },
    responses: mutationResponses,
  })
  registry.registerPath({
    method: 'post',
    path: '/contracts/{id}/cancel',
    tags: ['Contracts'],
    summary: 'Cancela um contrato ainda não ativo',
    description:
      'Exige motivo. Registra autor e instante no servidor, preservando documentos, histórico e cobranças. Não permite cancelar um contrato ativo ou encerrado.',
    security: [{ bearerAuth: [] }],
    request: {
      params: contractIdParamsSchema,
      body: { content: { 'application/json': { schema: transitionContractRequestSchema } } },
    },
    responses: mutationResponses,
  })
  registry.registerPath({
    method: 'post',
    path: '/contracts/{id}/close',
    tags: ['Contracts'],
    summary: 'Encerra um contrato ativo',
    description:
      'Exige motivo. Preserva o financeiro e registra autor e instante no servidor. Ao encerrar locação sem outro contrato ativo, inativa o imóvel sem apagar a data de publicação. Vendas preservam o estado Vendido.',
    security: [{ bearerAuth: [] }],
    request: {
      params: contractIdParamsSchema,
      body: { content: { 'application/json': { schema: transitionContractRequestSchema } } },
    },
    responses: mutationResponses,
  })
  registry.registerPath({
    method: 'get',
    path: '/contracts/{id}/history',
    tags: ['Contracts'],
    summary: 'Consulta o histórico autorizado do contrato',
    security: [{ bearerAuth: [] }],
    request: { params: contractIdParamsSchema, query: contractHistoryQuerySchema },
    responses: {
      ...mutationResponses,
      200: {
        description: 'Histórico paginado, sem CPF, IP ou dados do arquivo.',
        content: { 'application/json': { schema: contractHistoryResponseSchema } },
      },
    },
  })
  registry.registerPath({
    method: 'get',
    path: '/contracts/opportunities',
    tags: ['Contracts'],
    summary: 'Lista oportunidades elegíveis para gerar contrato',
    description:
      'Somente gestores e corretores. Retorna propostas aceitas, não arquivadas e ainda sem contrato. ' +
      'O corretor acessa somente imóveis sob sua responsabilidade. Busca, contagem e paginação ' +
      'aplicam o mesmo escopo. Inclui resumos do imóvel e do proprietário para revisão no cadastro.',
    security: [{ bearerAuth: [] }],
    request: { query: listContractOpportunitiesQuerySchema },
    responses: {
      200: {
        description: 'Oportunidades autorizadas e contagem total.',
        content: { 'application/json': { schema: contractOpportunitiesResponseSchema } },
      },
      400: {
        description: 'Busca ou paginação inválida.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Autenticação ausente ou inválida.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      403: {
        description: 'O ator não pode gerenciar contratos.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })
  registry.registerPath({
    method: 'post',
    path: '/contracts/{id}/parties/{partyId}/link-user',
    tags: ['Contracts'],
    summary: 'Gestor confirma o vínculo de um locatário pelo e-mail da parte',
    description:
      'Somente OWNER do tenant do contrato. Localiza uma conta RENTER ativa pelo e-mail da parte RENTER e persiste seu ID. Não substitui vínculo com outro usuário. A conta pode pertencer ao tenant compartilhado de locatários.',
    security: [{ bearerAuth: [] }],
    request: {
      params: contractPartyIdParamsSchema,
      body: { content: { 'application/json': { schema: linkContractPartyUserRequestSchema } } },
    },
    responses: {
      200: {
        description: 'Vínculo confirmado, inclusive quando já existe para o mesmo usuário.',
        content: { 'application/json': { schema: contractPartyUserLinkSchema } },
      },
      400: {
        description: 'E-mail inválido ou campos não permitidos.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      403: {
        description: 'Somente gestores podem confirmar o vínculo.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description:
          'Contrato ou parte locatária não encontrados no tenant, ou conta RENTER ativa não encontrada.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      409: {
        description:
          'E-mail diferente da parte, vínculo com outro usuário ou alteração concorrente.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/contracts',
    tags: ['Contracts'],
    summary: 'Lista os contratos visíveis para o ator',
    description:
      'OWNER veem todos os contratos do tenant. Quando o ator tem papel AGENT, a listagem é ' +
      'restrita aos contratos de imóveis dos quais ele é responsável. RENTER vê somente os contratos ' +
      'em que é a parte RENTER vinculada à sua conta, inclusive de imobiliárias fora do seu tenant ' +
      '(tenant compartilhado de locatários). Busca, contagem e paginação aplicam o mesmo escopo.',
    security: [{ bearerAuth: [] }],
    request: { query: listContractsQuerySchema },
    responses: {
      200: {
        description: 'Lista de contratos visíveis para o ator.',
        content: { 'application/json': { schema: contractsResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/contracts',
    tags: ['Contracts'],
    summary: 'Cria contrato a partir de uma oportunidade aceita',
    description:
      'Um ator AGENT só cria contrato a partir de oportunidade da qual é responsável ' +
      '(404 opaco caso contrário). RENTER não gerencia contratos.',
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { 'application/json': { schema: createContractRequestSchema } } },
    },
    responses: {
      201: {
        description: 'Contrato criado.',
        content: { 'application/json': { schema: contractResponseSchema } },
      },
      400: {
        description: 'Corpo da requisição inválido.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      403: {
        description: 'Autenticado como RENTER — não pode gerenciar contratos.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description:
          'Oportunidade não encontrada neste tenant, ou de imóvel de outro responsável (AGENT).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      409: {
        description: 'Oportunidade não aceita ou já tem contrato.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/contracts/{id}',
    tags: ['Contracts'],
    summary: 'Consulta um contrato visível para o ator',
    description:
      'Um ator AGENT recebe 404 opaco para um contrato de imóvel do qual não é responsável. ' +
      'RENTER consulta somente contratos em que é a parte RENTER vinculada à sua conta, mesmo ' +
      'fora do seu tenant, e recebe 404 opaco para os demais.',
    security: [{ bearerAuth: [] }],
    request: { params: contractIdParamsSchema },
    responses: {
      200: {
        description: 'Contrato encontrado.',
        content: { 'application/json': { schema: contractResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description:
          'Contrato não encontrado neste tenant, de imóvel de outro responsável (AGENT), ou sem ' +
          'vínculo do RENTER como parte locatária.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/contracts/{id}/parties/{partyId}/sign',
    tags: ['Contracts'],
    summary: 'Registra manualmente uma assinatura com PDF comprobatório',
    description:
      'Segue a mesma regra de acesso da consulta do contrato: um ator AGENT recebe 404 opaco para ' +
      'um contrato de imóvel do qual não é responsável. RENTER não registra assinaturas, mesmo nos ' +
      'contratos que consegue consultar. Exige um PDF enviado à revisão atual do contrato. Registra método manual, autor, data, hash do arquivo, IP confiável quando disponível e navegador. A integração com provedor externo ainda depende de escolha do produto.',
    security: [{ bearerAuth: [] }],
    request: {
      params: contractPartyIdParamsSchema,
      body: { content: { 'application/json': { schema: signContractPartyRequestSchema } } },
    },
    responses: {
      400: mutationResponses[400],
      200: {
        description: 'Assinatura registrada; contrato ativado se era a última assinatura pendente.',
        content: { 'application/json': { schema: contractResponseSchema } },
      },
      401: {
        description: 'Access token ausente, inválido ou expirado.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      403: {
        description: 'Autenticado como RENTER — não pode gerenciar contratos.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      404: {
        description:
          'Contrato ou parte não encontrados neste tenant, ou contrato de imóvel de outro ' +
          'responsável (AGENT).',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
      409: {
        description: 'Esta parte já assinou o contrato.',
        content: { 'application/json': { schema: errorResponseSchema } },
      },
    },
  })
}

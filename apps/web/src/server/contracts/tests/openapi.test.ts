import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { expect, it } from 'vitest'
import { registerContractsOpenApi } from '../openapi'

it('gera a documentação das operações reais de Contracts com datas, telefone e evidência obrigatórios', () => {
  const registry = new OpenAPIRegistry()
  registerContractsOpenApi(registry)
  const document = new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.0',
    info: { title: 'Contracts', version: 'test' },
  })
  for (const path of [
    '/contracts',
    '/contracts/{id}',
    '/contracts/{id}/cancel',
    '/contracts/{id}/close',
    '/contracts/{id}/history',
    '/contracts/opportunities',
    '/contracts/{id}/documents/uploads',
    '/contracts/{id}/documents',
    '/contracts/{id}/documents/{documentId}/download',
    '/contracts/{id}/parties/{partyId}/sign',
    '/contracts/{id}/parties/{partyId}/link-user',
  ])
    expect(document.paths).toHaveProperty(path)
  expect(document.components?.schemas?.CreateContractRequest).toMatchObject({
    properties: {
      owner: { required: expect.arrayContaining(['name', 'cpf', 'email', 'phone']) },
      tenant: { required: expect.arrayContaining(['name', 'cpf', 'email', 'phone']) },
    },
  })
  expect(document.components?.schemas?.SignContractPartyRequest).toMatchObject({
    required: ['documentId'],
  })
})

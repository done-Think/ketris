import { describe, expect, it, vi } from 'vitest'
import { InitContractDocumentUploadUseCase } from '../../../application/use-cases/init-contract-document-upload.use-case'
import { ConfirmContractDocumentUploadUseCase } from '../../../application/use-cases/confirm-contract-document-upload.use-case'
import { DownloadContractDocumentUseCase } from '../../../application/use-cases/download-contract-document.use-case'
import type { ContractDocumentRepository } from '../../../application/ports/contract-document-repository.port'
import type {
  ContractDocumentStorage,
  ContractDocumentUploadTickets,
} from '../../../application/ports/contract-document-storage.port'
import { documentDescriptor, documentActor } from '../../fixtures/document'

function setup() {
  const descriptor = { ...documentDescriptor }
  const repository = {
    context: vi
      .fn<ContractDocumentRepository['context']>()
      .mockResolvedValue({ id: 'contract', tenantId: 'agency', dataRevision: 2 }),
    find: vi.fn<ContractDocumentRepository['find']>().mockResolvedValue({
      id: 'document',
      contractId: 'contract',
      tenantId: 'agency',
      name: descriptor.name,
      objectKey: 'contracts/agency/contract/document.pdf',
      sha256: descriptor.sha256,
      size: descriptor.size,
    }),
    create: vi.fn<ContractDocumentRepository['create']>(),
  }
  const storage = {
    uploadLocation: vi.fn<ContractDocumentStorage['uploadLocation']>().mockResolvedValue({
      url: 'https://storage.example.test/upload',
      headers: { 'Content-Type': 'application/pdf' },
    }),
    inspect: vi.fn<ContractDocumentStorage['inspect']>().mockResolvedValue({
      size: descriptor.size,
      contentType: 'application/pdf',
      sha256: descriptor.sha256,
      pdf: true,
    }),
    downloadUrl: vi
      .fn<ContractDocumentStorage['downloadUrl']>()
      .mockResolvedValue('https://storage.example.test/download'),
  }
  const tickets = {
    issue: vi.fn<ContractDocumentUploadTickets['issue']>().mockResolvedValue('upload-ticket'),
    verify: vi.fn<ContractDocumentUploadTickets['verify']>().mockResolvedValue(descriptor),
  }
  return {
    descriptor,
    repository,
    storage,
    tickets,
    init: new InitContractDocumentUploadUseCase(repository, storage, tickets, {
      generate: () => 'document',
    }),
    confirm: new ConfirmContractDocumentUploadUseCase(repository, storage, tickets),
    download: new DownloadContractDocumentUseCase(repository, storage),
  }
}

describe('envio privado de documentos de Contracts', () => {
  it('autoriza o envio vinculado ao ator, tenant, contrato e revisão reais', async () => {
    const { init, repository, storage, tickets, descriptor } = setup()
    expect(
      await init.execute({
        ...documentActor,
        name: descriptor.name,
        size: descriptor.size,
        sha256: descriptor.sha256,
      }),
    ).toMatchObject({
      uploadToken: 'upload-ticket',
      uploadUrl: 'https://storage.example.test/upload',
    })
    expect(repository.context).toHaveBeenCalledWith('contract', {
      kind: 'tenant',
      tenantId: 'agency',
    })
    expect(storage.uploadLocation).toHaveBeenCalledWith(
      'contracts/agency/contract/document.pdf',
      descriptor,
    )
    expect(tickets.issue).toHaveBeenCalledWith(descriptor)
  })

  it.each(['RENTER', 'PROPERTY_OWNER'] as const)(
    'recusa envio pelo perfil %s antes de acessar dados ou storage',
    async (actorRole) => {
      const { init, confirm, repository, storage, descriptor } = setup()
      await expect(
        init.execute({ ...documentActor, actorRole, ...descriptor }),
      ).rejects.toMatchObject({ status: 403 })
      await expect(
        confirm.execute({ ...documentActor, actorRole, uploadToken: 'token' }),
      ).rejects.toMatchObject({ status: 403 })
      expect(repository.context).not.toHaveBeenCalled()
      expect(storage.uploadLocation).not.toHaveBeenCalled()
    },
  )

  it('restringe o envio pelo corretor ao imóvel sob sua responsabilidade', async () => {
    const { init, repository, descriptor } = setup()
    repository.context.mockResolvedValue(null)
    await expect(
      init.execute({
        ...documentActor,
        actorRole: 'AGENT',
        name: descriptor.name,
        size: descriptor.size,
        sha256: descriptor.sha256,
      }),
    ).rejects.toMatchObject({ status: 404 })
    expect(repository.context).toHaveBeenCalledWith('contract', {
      kind: 'tenant',
      tenantId: 'agency',
      responsibleId: 'manager',
    })
  })

  it.each(['actorId', 'tenantId', 'contractId'] as const)(
    'recusa reutilizar a autorização em outro %s',
    async (field) => {
      const { confirm, tickets, descriptor, storage, repository } = setup()
      tickets.verify.mockResolvedValue({ ...descriptor, [field]: 'other' })
      await expect(
        confirm.execute({ ...documentActor, uploadToken: 'token' }),
      ).rejects.toMatchObject({ status: 403 })
      expect(storage.inspect).not.toHaveBeenCalled()
      expect(repository.create).not.toHaveBeenCalled()
    },
  )

  it('recusa confirmação após edição sem registrar o documento antigo na revisão nova', async () => {
    const { confirm, repository, storage } = setup()
    repository.context.mockResolvedValue({ id: 'contract', tenantId: 'agency', dataRevision: 3 })
    await expect(confirm.execute({ ...documentActor, uploadToken: 'token' })).rejects.toMatchObject(
      { code: 'CONTRACT_DOCUMENT_OUTDATED' },
    )
    expect(storage.inspect).not.toHaveBeenCalled()
    expect(repository.create).not.toHaveBeenCalled()
  })

  it.each([
    { pdf: false },
    { contentType: 'text/plain' },
    { size: 513 },
    { sha256: 'a'.repeat(64) },
  ])('recusa conteúdo diferente dos metadados autorizados: %o', async (invalid) => {
    const { confirm, storage, repository, descriptor } = setup()
    storage.inspect.mockResolvedValue({
      pdf: true,
      contentType: 'application/pdf',
      size: descriptor.size,
      sha256: descriptor.sha256,
      ...invalid,
    })
    await expect(confirm.execute({ ...documentActor, uploadToken: 'token' })).rejects.toMatchObject(
      { code: 'CONTRACT_DOCUMENT_INVALID' },
    )
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('registra somente o arquivo conferido e encaminha o ator à transação', async () => {
    const { confirm, repository, descriptor } = setup()
    await confirm.execute({ ...documentActor, uploadToken: 'token' })
    expect(repository.create).toHaveBeenCalledWith(descriptor, {
      tenantId: 'agency',
      actorId: 'manager',
    })
  })
})

describe('download privado de documentos de Contracts', () => {
  it('autoriza o locatário pelo vínculo, inclusive fora do tenant do contrato', async () => {
    const { download, repository, storage } = setup()
    const result = await download.execute({
      ...documentActor,
      actorTenantId: 'renter-tenant',
      actorRole: 'RENTER',
      documentId: 'document',
    })
    expect(repository.find).toHaveBeenCalledWith('contract', 'document', {
      kind: 'party',
      userId: 'manager',
    })
    expect(storage.inspect).toHaveBeenCalledWith('contracts/agency/contract/document.pdf')
    expect(result.url).toBe('https://storage.example.test/download')
  })

  it.each([
    null,
    { ...documentDescriptor, objectKey: 'contracts/other/contract/document.pdf' },
    { ...documentDescriptor, objectKey: null },
  ])('recusa documento ausente, legado ou de caminho incompatível', async (invalid) => {
    const { download, repository, storage } = setup()
    repository.find.mockResolvedValue(invalid)
    await expect(
      download.execute({ ...documentActor, documentId: 'document' }),
    ).rejects.toMatchObject({ status: 404 })
    expect(storage.inspect).not.toHaveBeenCalled()
    expect(storage.downloadUrl).not.toHaveBeenCalled()
  })

  it('não emite URL se o conteúdo armazenado foi alterado', async () => {
    const { download, storage, descriptor } = setup()
    storage.inspect.mockResolvedValue({
      pdf: true,
      contentType: 'application/pdf',
      size: descriptor.size,
      sha256: 'a'.repeat(64),
    })
    await expect(
      download.execute({ ...documentActor, documentId: 'document' }),
    ).rejects.toMatchObject({ code: 'CONTRACT_DOCUMENT_INVALID' })
    expect(storage.downloadUrl).not.toHaveBeenCalled()
  })
})

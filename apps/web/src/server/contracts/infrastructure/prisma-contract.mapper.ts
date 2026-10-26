import type { Contract } from '../domain/contract.entity'
import type { ContractDataProtector } from '../application/ports/contract-data-protector.port'
import type {
  ContratoWithRelations,
  UsuarioRef,
  DocumentoWithRelations,
} from '../types/prisma-contract-repository'

export function toContractActor(usuario: UsuarioRef | null | undefined) {
  return usuario ? { id: usuario.id, name: usuario.nome } : null
}

export function toDomainContract(
  contrato: ContratoWithRelations,
  protector: ContractDataProtector,
): Contract {
  return {
    id: contrato.id,
    tenantId: contrato.tenantId,
    propertyId: contrato.imovelId,
    property: {
      title: contrato.imovel.titulo,
      address: contrato.imovel.endereco
        ? [
            contrato.imovel.endereco.logradouro,
            contrato.imovel.endereco.bairro,
            contrato.imovel.endereco.cidade,
          ]
            .filter(Boolean)
            .join(', ')
        : '',
    },
    opportunityId: contrato.oportunidadeOrigemId,
    code: contrato.codigo,
    type: contrato.tipo,
    amount: contrato.valor.toNumber(),
    dueDay: contrato.diaVencimento,
    startDate: contrato.dataInicio,
    endDate: contrato.dataFim,
    adjustmentIndex: contrato.indiceReajuste,
    guaranteeType: contrato.tipoGarantia,
    notes: contrato.observacoes,
    status: contrato.status,
    activatedAt: contrato.ativadoEm,
    activatedBy: toContractActor(contrato.ativadoPor),
    createdAt: contrato.createdAt,
    updatedAt: contrato.updatedAt,
    dataRevision: contrato.revisaoDados,
    createdBy: toContractActor(contrato.criadoPor),
    cancelledAt: contrato.canceladoEm,
    cancelledBy: toContractActor(contrato.canceladoPor),
    cancellationReason: contrato.motivoCancelamento,
    closedAt: contrato.encerradoEm,
    closedBy: toContractActor(contrato.encerradoPor),
    closingReason: contrato.motivoEncerramento,
    parties: contrato.partes.map((parte) => ({
      id: parte.id,
      userId: parte.usuarioId,
      role: parte.papel,
      name: parte.nome,
      cpf: protector.decryptCpf(parte.cpf, { tenantId: contrato.tenantId, partyId: parte.id }),
      email: parte.email,
      phone: parte.telefone,
      signatureStatus: parte.assinatura?.status ?? 'PENDENTE',
      signedAt: parte.assinatura?.assinadaEm ?? null,
      signedBy: toContractActor(parte.assinatura?.assinadaPor),
      signatureMethod: parte.assinatura?.metodo ?? null,
      signatureDocumentId: parte.assinatura?.documentoId ?? null,
      signatureDocumentHash: parte.assinatura?.sha256Documento ?? null,
      createdAt: parte.createdAt,
      updatedAt: parte.updatedAt,
    })),
    documents: contrato.documentos.map(toDomainContractDocument),
  }
}

export function toDomainContractDocument(documento: DocumentoWithRelations) {
  return {
    id: documento.id,
    name: documento.nome,
    url: documento.url,
    createdAt: documento.createdAt,
    updatedAt: documento.updatedAt,
    sha256: documento.sha256,
    size: documento.tamanhoBytes,
    uploadedBy: toContractActor(documento.enviadoPor),
    contractRevision: documento.revisaoContrato,
    canDownload: Boolean(documento.objectKey && documento.sha256),
  }
}

import type { Prisma } from '@prisma/client'
import type {
  MaintenanceActivity,
  MaintenanceAttachment,
  MaintenanceContract,
  MaintenanceTicket,
  NewMaintenanceActivity,
} from '../types/maintenance-ticket'
import type {
  MaintenanceContractRow,
  MaintenanceTicketRow,
} from '../types/prisma-maintenance-ticket-repository'

export const contractInclude = {
  imovel: true,
  partes: { include: { usuario: { select: { ativo: true, papel: true } } } },
} as const

export const ticketInclude = {
  imovel: true,
  contrato: { include: contractInclude },
  responsavel: { select: { nome: true } },
  atividades: { orderBy: { createdAt: 'asc' as const } },
  anexos: true,
  solicitacoesTroca: { orderBy: { createdAt: 'desc' as const } },
}

export function toContract(row: MaintenanceContractRow): MaintenanceContract {
  return {
    id: row.id,
    tenantId: row.tenantId,
    code: row.codigo,
    propertyId: row.imovelId,
    propertyTitle: row.imovel.titulo,
    agentId: row.imovel.responsavelId,
    ownerId: row.imovel.proprietarioId,
    renterIds: row.partes
      .filter(
        (p) =>
          p.papel === 'LOCATARIO' &&
          p.usuarioId &&
          p.usuario?.ativo &&
          p.usuario.papel === 'RENTER',
      )
      .map((p) => p.usuarioId!),
    parties: row.partes.map((p) => ({
      id: p.id,
      name: p.nome,
      role: p.papel,
      userId: p.usuarioId,
    })),
  }
}

export function toActivity(row: MaintenanceTicketRow['atividades'][number]): MaintenanceActivity {
  return {
    id: row.id,
    ticketId: row.chamadoId,
    type: row.tipo,
    message: row.mensagem,
    systemAction: row.systemAction,
    authorId: row.autorId,
    authorName: row.autorNome,
    createdAt: row.createdAt,
    details: row.detalhes as Record<string, unknown> | null,
  }
}

export function toAttachment(row: MaintenanceTicketRow['anexos'][number]): MaintenanceAttachment {
  return {
    id: row.id,
    ticketId: row.chamadoId,
    name: row.nome,
    url: row.url,
    createdAt: row.createdAt,
  }
}

export function toTicket(row: MaintenanceTicketRow): MaintenanceTicket {
  const contract = row.contrato ? toContract(row.contrato) : null
  return {
    id: row.id,
    tenantId: row.tenantId,
    propertyId: row.imovelId,
    propertyTitle: row.imovel.titulo,
    contractId: row.contratoId,
    responsibleId: row.responsavelId,
    responsibleName: row.responsavel?.nome ?? null,
    provider: row.prestadorNome
      ? {
          ...(row.prestadorId ? { id: row.prestadorId } : {}),
          name: row.prestadorNome,
          phone: row.prestadorTelefone,
          email: row.prestadorEmail,
          notes: row.prestadorObservacoes,
        }
      : null,
    completedByRole: row.concluidoPorPapel,
    deletedAt: row.excluidoEm,
    category: row.categoria,
    priority: row.prioridade,
    status: row.status,
    title: row.titulo,
    description: row.descricao,
    openedById: row.abertoPorId,
    openedByName: row.abertoPorNome,
    resolvedAt: row.resolvidoEm,
    scheduledAt: row.atendimentoEm,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    activities: row.atividades.map(toActivity),
    attachments: row.anexos.map(toAttachment),
    replacementRequests: row.solicitacoesTroca.map((r) => ({
      id: r.id,
      reason: r.justificativa,
      requestedById: r.solicitanteId,
      requestedByName: r.solicitanteNome,
      status: r.status,
      decisionReason: r.decisaoJustificativa,
      decidedByName: r.decididoPorNome,
      decidedAt: r.decididoEm,
      createdAt: r.createdAt,
    })),
    access: {
      agentId: row.imovel.responsavelId,
      ownerId: row.imovel.proprietarioId,
      renterIds: contract?.renterIds ?? [],
      validContract: Boolean(
        contract &&
        contract.propertyId === row.imovelId &&
        row.contrato?.tenantId === row.tenantId &&
        row.imovel.tenantId === row.tenantId,
      ),
    },
  }
}

export function activityData(
  ticketId: string,
  activity: NewMaintenanceActivity,
): Prisma.AtividadeChamadoManutencaoUncheckedCreateInput {
  return {
    chamadoId: ticketId,
    tipo: activity.type,
    mensagem: activity.message,
    systemAction: activity.systemAction,
    autorId: activity.authorId,
    autorNome: activity.authorName,
    ...(activity.details
      ? { detalhes: JSON.parse(JSON.stringify(activity.details)) as Prisma.InputJsonObject }
      : {}),
  }
}

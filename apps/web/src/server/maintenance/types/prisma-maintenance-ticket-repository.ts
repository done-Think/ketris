import type {
  Prisma,
  AnexoChamadoManutencao,
  AtividadeChamadoManutencao,
  ChamadoManutencao,
  Contrato,
  Imovel,
  ParteContrato,
  SolicitacaoTrocaPrestador,
  Usuario,
} from '@prisma/client'

export type MaintenanceContractRow = Contrato & {
  imovel: Imovel
  partes: (ParteContrato & { usuario: Pick<Usuario, 'ativo' | 'papel'> | null })[]
}

export type MaintenanceTicketRow = ChamadoManutencao & {
  imovel: Imovel
  contrato: MaintenanceContractRow | null
  responsavel: Pick<Usuario, 'nome'> | null
  atividades: AtividadeChamadoManutencao[]
  anexos: AnexoChamadoManutencao[]
  solicitacoesTroca: SolicitacaoTrocaPrestador[]
}

export interface MaintenanceContractPartyLinkInput {
  actorTenantId: string
  actorId: string
  actorPapel: Usuario['papel']
  contractId: string
  partyId: string
  userId: string
}

// Links a contract party to a renter inside the maintenance transaction. Wired by the container
// (contracts owns the rule), so maintenance infrastructure never imports the contracts module.
export type MaintenanceContractPartyLinkerFactory = (tx: Prisma.TransactionClient) => {
  execute(input: MaintenanceContractPartyLinkInput): Promise<unknown>
}

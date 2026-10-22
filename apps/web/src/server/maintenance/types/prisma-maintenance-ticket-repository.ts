import type {
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

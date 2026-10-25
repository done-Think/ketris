import type { Papel } from '@server/auth/domain/user.entity'

export interface AgendaLinkedUserCandidate {
  id: string
  email: string
  tenantId: string
  papel: Papel
  ativo: boolean
  vinculoAprovadoEm: Date | null
}

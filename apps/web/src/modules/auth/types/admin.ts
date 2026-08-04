export type Papel = 'ADMIN' | 'OWNER' | 'AGENT'

export interface AdminUser {
  id: string
  tenantId: string
  nome: string
  email: string
  papel: Papel
  ativo: boolean
}

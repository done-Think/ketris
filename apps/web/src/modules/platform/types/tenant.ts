export interface TenantSummary {
  id: string
  nome: string
  slug: string
  createdAt: string
}

export type TenantUserPapel = 'ADMIN' | 'OWNER' | 'AGENT'

export interface TenantUser {
  id: string
  tenantId: string
  nome: string
  email: string
  papel: TenantUserPapel
  ativo: boolean
}

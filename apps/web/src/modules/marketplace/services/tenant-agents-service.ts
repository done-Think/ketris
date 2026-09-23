import { httpClient } from '@shared/lib/api/http-client'

// Busca direto em /auth/users (sem importar o módulo auth — Princípio I) só pra montar a lista
// de corretores do próprio tenant que podem ser destacados no perfil público da imobiliária.
export interface TenantAgent {
  id: string
  name: string
  email: string
  role: string
  active: boolean
}

interface ListTenantUsersResponse {
  users: TenantAgent[]
}

export function listTenantAgents(): Promise<TenantAgent[]> {
  return httpClient
    .get<ListTenantUsersResponse>('/auth/users')
    .then((data) => data.users.filter((user) => user.role === 'AGENT' && user.active))
}

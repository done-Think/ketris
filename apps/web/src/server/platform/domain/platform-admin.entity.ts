export interface PlatformAdmin {
  id: string
  nome: string
  email: string
  senhaHash: string
  ativo: boolean
}

export type AuthenticatedPlatformAdmin = Omit<PlatformAdmin, 'senhaHash'>

export function toAuthenticatedPlatformAdmin(admin: PlatformAdmin): AuthenticatedPlatformAdmin {
  return {
    id: admin.id,
    nome: admin.nome,
    email: admin.email,
    ativo: admin.ativo,
  }
}

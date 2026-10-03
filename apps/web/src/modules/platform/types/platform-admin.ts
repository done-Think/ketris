export interface PlatformAdminAccount {
  id: string
  nome: string
  email: string
  ativo: boolean
}

export interface CreatePlatformAdminPayload {
  nome: string
  email: string
  password: string
}

export interface PlatformAdminResponse {
  admin: PlatformAdminAccount
}

export interface ListPlatformAdminsResponse {
  admins: PlatformAdminAccount[]
}

export interface CreatePlatformAdminInput {
  nome: string
  email: string
  password: string
}

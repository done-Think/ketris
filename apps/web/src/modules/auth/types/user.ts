import type { Role } from './admin'

export interface TenantUser {
  id: string
  tenantId: string
  name: string
  email: string
  avatarUrl?: string | null
  role: Role
  active: boolean
  pendingApproval: boolean
}

export interface CreateTenantUserPayload {
  name: string
  email: string
  password: string
  role: 'OWNER' | 'AGENT'
}

export interface CreateTenantUserResponse {
  user: TenantUser
}

export interface ListUsersResponse {
  users: TenantUser[]
}

export interface ApproveMembershipResponse {
  user: TenantUser
}

export interface UpdateUserResponse {
  user: TenantUser
}

export interface UploadAvatarResponse {
  media: { url: string }
}

export type UpdateCurrentUserPayload = {
  name: string
  email: string
  avatarUrl?: string | null
}

import type { AppLocale } from '@/i18n/types/locale.types'
import type { Papel, TenantMemberPapel } from '../domain/user.entity'

export interface ApproveUserMembershipInput {
  actorId: string
  actorTenantId: string
  actorPapel: Papel
  userId: string
}

export interface ChangeOwnPasswordInput {
  userId: string
  currentPassword: string
  password: string
}

export interface CreateUserInput {
  actorId: string
  actorTenantId: string
  actorPapel: Papel
  nome: string
  email: string
  password: string
  papel: TenantMemberPapel
}

export interface DeactivateUserInput {
  actorId: string
  actorTenantId: string
  actorPapel: Papel
  userId: string
}

export interface GetUserInput {
  actorId?: string
  actorTenantId: string
  actorPapel: Papel
  userId: string
}

export interface ListUsersInput {
  page?: number
  pageSize?: number
  pendingApproval?: boolean
  actorTenantId: string
  actorPapel: Papel
}

export interface LoginInput {
  email: string
  password: string
  tenantId?: string
}

export interface LogoutInput {
  refreshToken: string
}

export interface RefreshAccessTokenInput {
  refreshToken: string
}

export interface RequestPasswordResetCodeInput {
  email: string
  locale: AppLocale
}

export interface ResetPasswordInput {
  email: string
  password: string
  resetToken: string
  tenantId?: string
}

export interface UpdateUserInput {
  telefone?: string | null
  creci?: string | null
  actorId: string
  actorTenantId: string
  actorPapel: Papel
  userId: string
  nome?: string
  email?: string
  avatarUrl?: string | null
  papel?: TenantMemberPapel
}

export interface VerifyPasswordResetCodeInput {
  email: string
  code: string
  tenantId?: string
}

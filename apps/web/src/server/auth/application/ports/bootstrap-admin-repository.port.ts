import type { User } from '../../domain/user.entity'

export interface BootstrapAdminInput {
  tenantSlug: string
  nome: string
  email: string
  senhaHash: string
}

export type BootstrapAdminResult =
  | { status: 'created'; user: User }
  | { status: 'tenant_not_found' }
  | { status: 'admin_already_exists' }
  | { status: 'email_already_in_use' }

export interface BootstrapAdminRepository {
  bootstrapFirstAdmin(input: BootstrapAdminInput): Promise<BootstrapAdminResult>
}

import type { PlatformAdmin } from '../../domain/platform-admin.entity'

export interface BootstrapPlatformAdminInput {
  nome: string
  email: string
  senhaHash: string
}

export type BootstrapPlatformAdminResult =
  | { status: 'created'; admin: PlatformAdmin }
  | { status: 'already_bootstrapped' }
  | { status: 'email_already_in_use' }

export interface PlatformBootstrapRepository {
  bootstrapFirstPlatformAdmin(
    input: BootstrapPlatformAdminInput,
  ): Promise<BootstrapPlatformAdminResult>
}

import type { PlatformAdmin } from '../../domain/platform-admin.entity'

export interface NewPlatformAdmin {
  nome: string
  email: string
  senhaHash: string
}

export interface PlatformAdminUpdate {
  nome?: string
  email?: string
}

export interface PlatformAdminRepository {
  findById(id: string): Promise<PlatformAdmin | null>
  findByEmail(email: string): Promise<PlatformAdmin | null>
  findMany(): Promise<PlatformAdmin[]>
  create(admin: NewPlatformAdmin): Promise<PlatformAdmin>
  update(id: string, changes: PlatformAdminUpdate): Promise<PlatformAdmin>
  deactivate(id: string): Promise<PlatformAdmin>
}

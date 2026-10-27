import type { PlatformAdmin } from '../../types/platform-admin'
import type { NewPlatformAdmin, PlatformAdminUpdate } from '../../types/platform-admin-repository'

export interface PlatformAdminRepository {
  findById(id: string): Promise<PlatformAdmin | null>
  findByEmail(email: string): Promise<PlatformAdmin | null>
  findMany(): Promise<PlatformAdmin[]>
  create(admin: NewPlatformAdmin): Promise<PlatformAdmin>
  update(id: string, changes: PlatformAdminUpdate): Promise<PlatformAdmin | null>
  deactivate(id: string): Promise<PlatformAdmin | null>
  recordAccess(id: string, at: Date): Promise<void>
}

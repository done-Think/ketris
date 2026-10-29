import { vi } from 'vitest'
import type { PropertyOwnerDirectory } from '../../application/ports/property-owner-directory.port'

export function createOwnerDirectory(): PropertyOwnerDirectory {
  return {
    findActiveOwner: vi.fn().mockResolvedValue({ id: 'owner-1', name: 'Owner' }),
    listActiveOwners: vi.fn().mockResolvedValue([]),
  }
}

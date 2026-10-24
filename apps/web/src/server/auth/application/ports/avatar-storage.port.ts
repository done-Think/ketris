import type { AvatarStorageInput, StoredAvatar } from '../../types/avatar'

export interface AvatarStorage {
  upload(input: AvatarStorageInput): Promise<StoredAvatar>
}

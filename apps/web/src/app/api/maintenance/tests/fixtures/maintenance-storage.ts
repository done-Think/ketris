import { vi } from 'vitest'

export const uploadToStorage = vi.fn()
export const downloadFromStorage = vi
  .fn()
  .mockResolvedValue({ url: 'https://private-storage.example.test/temporary-image' })
export const prepareStorageUpload = vi.fn()
export const inspectStorageUpload = vi.fn()

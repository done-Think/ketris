import { describe, expect, it, vi } from 'vitest'

import { PropertyMediaValidationError } from '../../../domain/errors'
import type { PropertyMediaStoragePort } from '../../../application/ports/property-media-storage.port'
import { UploadPropertyMediaUseCase } from '../../../application/use-cases/upload-property-media.use-case'

function createStorage(overrides?: Partial<PropertyMediaStoragePort>): PropertyMediaStoragePort {
  return {
    upload: vi.fn().mockResolvedValue({
      url: '/api/properties/media/properties/tenant-1/uuid-photo.jpg',
      contentType: 'image/jpeg',
    }),
    ...overrides,
  }
}

const baseInput = {
  actorTenantId: 'tenant-1',
  actorPapel: 'AGENT' as const,
  filename: 'photo.jpg',
  contentType: 'image/jpeg',
  body: Buffer.from('fake-image-bytes'),
}

describe('UploadPropertyMediaUseCase', () => {
  it('uploads a valid image and returns the storage result', async () => {
    const storage = createStorage()
    const useCase = new UploadPropertyMediaUseCase(storage)

    const result = await useCase.execute(baseInput)

    expect(storage.upload).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      filename: 'photo.jpg',
      contentType: 'image/jpeg',
      body: baseInput.body,
    })
    expect(result.url).toBe('/api/properties/media/properties/tenant-1/uuid-photo.jpg')
  })

  it('bloqueia RENTER ao tentar enviar mídia', async () => {
    const storage = createStorage()
    const useCase = new UploadPropertyMediaUseCase(storage)

    await expect(useCase.execute({ ...baseInput, actorPapel: 'RENTER' })).rejects.toThrow(
      'Locatários não podem gerenciar imóveis.',
    )
    expect(storage.upload).not.toHaveBeenCalled()
  })

  it('rejeita arquivo vazio', async () => {
    const storage = createStorage()
    const useCase = new UploadPropertyMediaUseCase(storage)

    await expect(useCase.execute({ ...baseInput, body: Buffer.alloc(0) })).rejects.toThrow(
      PropertyMediaValidationError,
    )
    expect(storage.upload).not.toHaveBeenCalled()
  })

  it('rejeita arquivo maior que 8MB', async () => {
    const storage = createStorage()
    const useCase = new UploadPropertyMediaUseCase(storage)

    await expect(
      useCase.execute({ ...baseInput, body: Buffer.alloc(9 * 1024 * 1024) }),
    ).rejects.toThrow(PropertyMediaValidationError)
    expect(storage.upload).not.toHaveBeenCalled()
  })

  it('rejeita formato não suportado', async () => {
    const storage = createStorage()
    const useCase = new UploadPropertyMediaUseCase(storage)

    await expect(useCase.execute({ ...baseInput, contentType: 'application/pdf' })).rejects.toThrow(
      PropertyMediaValidationError,
    )
    expect(storage.upload).not.toHaveBeenCalled()
  })

  it.each(['image/jpeg', 'image/png', 'image/webp'])('aceita o formato %s', async (contentType) => {
    const storage = createStorage()
    const useCase = new UploadPropertyMediaUseCase(storage)

    await expect(useCase.execute({ ...baseInput, contentType })).resolves.toBeDefined()
  })
})

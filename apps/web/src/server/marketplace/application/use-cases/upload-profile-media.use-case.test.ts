import { describe, expect, it, vi } from 'vitest'

import { ProfileMediaValidationError } from '../../domain/errors'
import type { ProfileMediaStoragePort } from '../ports/profile-media-storage.port'
import { UploadProfileMediaUseCase } from './upload-profile-media.use-case'

function createStorage(overrides?: Partial<ProfileMediaStoragePort>): ProfileMediaStoragePort {
  return {
    upload: vi.fn().mockResolvedValue({
      url: '/api/marketplace/media/profiles/brokers/user-1/uuid-photo.jpg',
      contentType: 'image/jpeg',
    }),
    ...overrides,
  }
}

const baseInput = {
  actorId: 'user-1',
  actorTenantId: 'tenant-1',
  actorPapel: 'AGENT' as const,
  target: 'broker-avatar' as const,
  filename: 'photo.jpg',
  contentType: 'image/jpeg',
  body: Buffer.from('fake-image-bytes'),
}

describe('UploadProfileMediaUseCase', () => {
  it('faz upload de uma imagem válida de corretor e devolve a URL', async () => {
    const storage = createStorage()
    const useCase = new UploadProfileMediaUseCase(storage)

    const result = await useCase.execute(baseInput)

    expect(storage.upload).toHaveBeenCalledWith({
      keyPrefix: 'profiles/brokers/user-1/avatar-',
      filename: 'photo.jpg',
      contentType: 'image/jpeg',
      body: baseInput.body,
    })
    expect(result.url).toBe('/api/marketplace/media/profiles/brokers/user-1/uuid-photo.jpg')
  })

  it.each([
    ['broker-avatar', 'profiles/brokers/user-1/avatar-'],
    ['broker-banner', 'profiles/brokers/user-1/banner-'],
  ] as const)('usa o prefixo certo para %s', async (target, expectedPrefix) => {
    const storage = createStorage()
    const useCase = new UploadProfileMediaUseCase(storage)

    await useCase.execute({ ...baseInput, target })

    expect(storage.upload).toHaveBeenCalledWith(
      expect.objectContaining({ keyPrefix: expectedPrefix }),
    )
  })

  it.each([
    ['agency-logo', 'profiles/agencies/tenant-1/logo-'],
    ['agency-banner', 'profiles/agencies/tenant-1/banner-'],
  ] as const)('usa o prefixo certo para %s', async (target, expectedPrefix) => {
    const storage = createStorage()
    const useCase = new UploadProfileMediaUseCase(storage)

    await useCase.execute({ ...baseInput, actorPapel: 'ADMIN', target })

    expect(storage.upload).toHaveBeenCalledWith(
      expect.objectContaining({ keyPrefix: expectedPrefix }),
    )
  })

  it('bloqueia quem não é AGENT de enviar mídia de corretor', async () => {
    const storage = createStorage()
    const useCase = new UploadProfileMediaUseCase(storage)

    await expect(
      useCase.execute({ ...baseInput, actorPapel: 'ADMIN', target: 'broker-avatar' }),
    ).rejects.toThrow('Só corretores')
    expect(storage.upload).not.toHaveBeenCalled()
  })

  it('bloqueia quem não é ADMIN/OWNER de enviar mídia de imobiliária', async () => {
    const storage = createStorage()
    const useCase = new UploadProfileMediaUseCase(storage)

    await expect(
      useCase.execute({ ...baseInput, actorPapel: 'AGENT', target: 'agency-logo' }),
    ).rejects.toThrow('Só administradores')
    expect(storage.upload).not.toHaveBeenCalled()
  })

  it('rejeita arquivo vazio', async () => {
    const storage = createStorage()
    const useCase = new UploadProfileMediaUseCase(storage)

    await expect(useCase.execute({ ...baseInput, body: Buffer.alloc(0) })).rejects.toThrow(
      ProfileMediaValidationError,
    )
    expect(storage.upload).not.toHaveBeenCalled()
  })

  it('rejeita arquivo maior que 8MB', async () => {
    const storage = createStorage()
    const useCase = new UploadProfileMediaUseCase(storage)

    await expect(
      useCase.execute({ ...baseInput, body: Buffer.alloc(9 * 1024 * 1024) }),
    ).rejects.toThrow(ProfileMediaValidationError)
    expect(storage.upload).not.toHaveBeenCalled()
  })

  it('rejeita formato não suportado', async () => {
    const storage = createStorage()
    const useCase = new UploadProfileMediaUseCase(storage)

    await expect(useCase.execute({ ...baseInput, contentType: 'application/pdf' })).rejects.toThrow(
      ProfileMediaValidationError,
    )
    expect(storage.upload).not.toHaveBeenCalled()
  })

  it.each(['image/jpeg', 'image/png', 'image/webp'])('aceita o formato %s', async (contentType) => {
    const storage = createStorage()
    const useCase = new UploadProfileMediaUseCase(storage)

    await expect(useCase.execute({ ...baseInput, contentType })).resolves.toBeDefined()
  })
})

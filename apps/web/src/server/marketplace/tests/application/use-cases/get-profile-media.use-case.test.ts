import { describe, expect, it, vi } from 'vitest'

import type { ProfileMediaStoragePort } from '../../../application/ports/profile-media-storage.port'
import { GetProfileMediaUseCase } from '../../../application/use-cases/get-profile-media.use-case'
import { ProfileMediaNotFoundError } from '../../../domain/errors'
import type { StoredProfileMedia } from '../../../types/profile-media'

const media: StoredProfileMedia = { body: new Uint8Array([1, 2, 3]), contentType: 'image/webp' }

function createStorage(read: ProfileMediaStoragePort['read']): ProfileMediaStoragePort {
  return { read, upload: vi.fn() }
}

describe('GetProfileMediaUseCase', () => {
  it('lê do storage a chave pública de perfis', async () => {
    const read = vi.fn().mockResolvedValue(media)
    const useCase = new GetProfileMediaUseCase(createStorage(read))

    await expect(
      useCase.execute(['profiles', 'brokers', 'usuario-1', 'avatar.webp']),
    ).resolves.toBe(media)
    expect(read).toHaveBeenCalledWith('profiles/brokers/usuario-1/avatar.webp')
  })

  it.each([
    [['contracts', 'tenant-1', 'contrato.pdf', 'x']],
    [['profiles', 'users', 'usuario-1', 'avatar.webp']],
    [['profiles', 'brokers', '..', 'avatar.webp']],
    [['profiles', 'agencies', 'tenant%2F1', 'logo.webp']],
    [['profiles', 'brokers', 'avatar.webp']],
  ])('recusa chaves fora do escopo público sem tocar o storage: %j', async (segments) => {
    const read = vi.fn()
    const useCase = new GetProfileMediaUseCase(createStorage(read))

    await expect(useCase.execute(segments)).rejects.toBeInstanceOf(ProfileMediaNotFoundError)
    expect(read).not.toHaveBeenCalled()
  })

  it('responde não encontrado quando o arquivo não existe', async () => {
    const useCase = new GetProfileMediaUseCase(createStorage(vi.fn().mockResolvedValue(null)))

    await expect(
      useCase.execute(['profiles', 'agencies', 'tenant-1', 'logo.webp']),
    ).rejects.toBeInstanceOf(ProfileMediaNotFoundError)
  })
})

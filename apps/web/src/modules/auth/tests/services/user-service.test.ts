import { describe, expect, it, vi } from 'vitest'

import { HttpClient } from '@shared/lib/api/http-client'
import { UserService } from '../../services/user-service'

const user = { id: 'self', phone: '35999998888', creci: '12345' }

describe('UserService', () => {
  it('carrega sequencialmente todas as páginas dos pendentes sem perder solicitações', async () => {
    const client = new HttpClient('/api')
    const first = Array.from({ length: 100 }, (_, index) => ({ ...user, id: `user-${index}` }))
    const get = vi
      .spyOn(client, 'get')
      .mockResolvedValueOnce({ users: first, total: 101, page: 1, pageSize: 100 })
      .mockResolvedValueOnce({
        users: [{ ...user, id: 'last' }],
        total: 101,
        page: 2,
        pageSize: 100,
      })
    const result = await new UserService(client).list(true)
    expect(result).toHaveLength(101)
    expect(result[100].id).toBe('last')
    expect(get).toHaveBeenNthCalledWith(1, '/auth/users', {
      params: { page: 1, pageSize: 100, pendingApproval: true },
    })
    expect(get).toHaveBeenNthCalledWith(2, '/auth/users', {
      params: { page: 2, pageSize: 100, pendingApproval: true },
    })
  })
  it('loads and saves the real phone and CRECI through the user contract', async () => {
    const client = new HttpClient('/api')
    const get = vi.spyOn(client, 'get').mockResolvedValue({ user })
    const patch = vi.spyOn(client, 'patch').mockResolvedValue({ user })
    const service = new UserService(client)
    await expect(service.get('self')).resolves.toEqual(user)
    await expect(
      service.update('self', { name: 'Ana', phone: user.phone, creci: user.creci }),
    ).resolves.toEqual(user)
    expect(get).toHaveBeenCalledWith('/auth/users/self')
    expect(patch).toHaveBeenCalledWith('/auth/users/self', {
      name: 'Ana',
      phone: user.phone,
      creci: user.creci,
    })
  })
  it('uses dedicated own-email confirmation and password endpoints', async () => {
    const client = new HttpClient('/api')
    const post = vi.spyOn(client, 'post').mockResolvedValue(undefined)
    const service = new UserService(client)
    await service.requestEmailChange('new@example.com', 'pt-BR')
    await service.confirmEmailChange('new@example.com', '123456')
    await service.changeOwnPassword('old-password', 'new-password')
    expect(post).toHaveBeenNthCalledWith(1, '/auth/me/email-change', {
      email: 'new@example.com',
      locale: 'pt-BR',
    })
    expect(post).toHaveBeenNthCalledWith(2, '/auth/me/email-change/verify', {
      email: 'new@example.com',
      code: '123456',
    })
    expect(post).toHaveBeenNthCalledWith(3, '/auth/me/password', {
      currentPassword: 'old-password',
      password: 'new-password',
    })
  })
  it('uploads multipart avatars to the authenticated self endpoint', async () => {
    const client = new HttpClient('/api')
    const post = vi.spyOn(client, 'post').mockResolvedValue({ media: { url: '/avatar.png' } })
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    await expect(new UserService(client).uploadAvatar(file)).resolves.toBe('/avatar.png')
    expect(post).toHaveBeenCalledWith('/auth/me/avatar', expect.any(FormData), {
      headers: { 'Content-Type': undefined },
    })
    expect((post.mock.calls[0][1] as FormData).get('file')).toEqual(file)
  })
})

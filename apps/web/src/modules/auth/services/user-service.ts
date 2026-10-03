import { BaseService } from '@shared/lib/api/base-service'

import type { TenantUser } from '../types/user'

interface ListUsersResponse {
  users: TenantUser[]
}

interface ApproveMembershipResponse {
  user: TenantUser
}

interface UpdateUserResponse {
  user: TenantUser
}

interface UploadAvatarResponse {
  media: { url: string }
}

export type UpdateCurrentUserPayload = {
  name: string
  email: string
  avatarUrl?: string | null
}

class UserService extends BaseService {
  private readonly path = '/auth/users'

  list(): Promise<TenantUser[]> {
    return this.http.get<ListUsersResponse>(this.path).then((data) => data.users)
  }

  approveMembership(id: string): Promise<TenantUser> {
    return this.http
      .patch<ApproveMembershipResponse>(`${this.path}/${id}/approve`)
      .then((data) => data.user)
  }

  update(id: string, payload: UpdateCurrentUserPayload): Promise<TenantUser> {
    return this.http
      .patch<UpdateUserResponse>(`${this.path}/${id}`, payload)
      .then((data) => data.user)
  }

  uploadAvatar(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)

    return this.http
      .post<UploadAvatarResponse>('/properties/media', formData, {
        headers: { 'Content-Type': undefined },
      })
      .then((data) => data.media.url)
  }

  changeOwnPassword(password: string): Promise<void> {
    return this.http.post<void>('/auth/me/password', { password })
  }
}

export const userService = new UserService()

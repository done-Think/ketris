import { BaseService } from '@shared/lib/api/base-service'

import type {
  ApproveMembershipResponse,
  CreateTenantUserPayload,
  CreateTenantUserResponse,
  ListUsersResponse,
  TenantUser,
  UpdateCurrentUserPayload,
  UpdateUserResponse,
  UploadAvatarResponse,
} from '../types/user'

class UserService extends BaseService {
  private readonly path = '/auth/users'

  list(): Promise<TenantUser[]> {
    return this.http.get<ListUsersResponse>(this.path).then((data) => data.users)
  }

  create(payload: CreateTenantUserPayload): Promise<TenantUser> {
    return this.http.post<CreateTenantUserResponse>(this.path, payload).then((data) => data.user)
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
      .post<UploadAvatarResponse>('/auth/me/avatar', formData, {
        headers: { 'Content-Type': undefined },
      })
      .then((data) => data.media.url)
  }

  changeOwnPassword(currentPassword: string, password: string): Promise<void> {
    return this.http.post<void>('/auth/me/password', { currentPassword, password })
  }
}

export const userService = new UserService()

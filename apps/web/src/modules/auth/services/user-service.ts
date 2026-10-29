import type { AppLocale } from '@/i18n/types/locale.types'

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

export class UserService extends BaseService {
  private readonly path = '/auth/users'

  get(id: string): Promise<TenantUser> {
    return this.http.get<UpdateUserResponse>(`${this.path}/${id}`).then((data) => data.user)
  }

  requestEmailChange(email: string, locale: AppLocale): Promise<void> {
    return this.http.post<void>('/auth/me/email-change', { email, locale })
  }

  confirmEmailChange(email: string, code: string): Promise<void> {
    return this.http.post<void>('/auth/me/email-change/verify', { email, code })
  }

  async list(pendingApproval?: boolean): Promise<TenantUser[]> {
    const users: TenantUser[] = []
    let page = 1
    while (true) {
      const result = await this.http.get<ListUsersResponse>(this.path, {
        params: {
          page,
          pageSize: 100,
          ...(pendingApproval === undefined ? {} : { pendingApproval }),
        },
      })
      users.push(...result.users)
      if (result.users.length === 0 || page * result.pageSize >= result.total) return users
      page += 1
    }
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

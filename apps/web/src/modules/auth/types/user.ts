import type {
  AuthenticatedUserResponseDTO,
  CreateUserRequestInput,
  CreateUserResponseDTO,
  ListUsersResponseDTO,
  GetUserResponseDTO,
  UpdateUserResponseDTO,
  UpdateUserRequestDTO,
  UploadAvatarResponseDTO,
} from '@server/auth/types/http'

export type TenantUser = AuthenticatedUserResponseDTO
export type CreateTenantUserPayload = CreateUserRequestInput
export type CreateTenantUserResponse = CreateUserResponseDTO
export type ListUsersResponse = ListUsersResponseDTO
export type ApproveMembershipResponse = GetUserResponseDTO
export type UpdateUserResponse = UpdateUserResponseDTO
export type UploadAvatarResponse = UploadAvatarResponseDTO
export type UpdateCurrentUserPayload = Required<Pick<UpdateUserRequestDTO, 'name'>> &
  Pick<UpdateUserRequestDTO, 'phone' | 'creci' | 'avatarUrl'>

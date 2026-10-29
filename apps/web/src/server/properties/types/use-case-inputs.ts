import type { UserRole } from '@server/auth/domain/user.entity'
import type { NewProperty, PropertyChanges, PropertyListFilters } from './property'

export type CreatePropertyInput = Omit<NewProperty, 'tenantId' | 'responsibleId'> & {
  actorTenantId: string
  actorUserId: string
  actorRole: UserRole
}

export type DeletePropertyInput = {
  actorTenantId: string
  actorId: string
  id: string
  actorRole: UserRole
}

export type GetPropertyInput = {
  actorTenantId: string
  actorId: string
  actorRole: UserRole
  id: string
}

export type ListPropertiesInput = Omit<
  PropertyListFilters,
  'tenantId' | 'responsibleId' | 'renterId' | 'ownerId'
> & {
  actorTenantId: string
  actorId: string
  actorRole: UserRole
}

export type PublishPropertyInput = {
  actorTenantId: string
  actorId: string
  id: string
  publishedAt?: Date
  actorRole: UserRole
}

export type TransitionPropertyFromActiveContractInput = {
  actorTenantId: string
  contractId: string
}

export type UnpublishPropertyInput = {
  actorTenantId: string
  actorId: string
  id: string
  actorRole: UserRole
}

export type UpdatePropertyInput = PropertyChanges & {
  actorTenantId: string
  actorId: string
  actorRole: UserRole
  id: string
}

export interface UploadPropertyMediaUseCaseInput {
  actorTenantId: string
  actorRole: UserRole
  filename: string
  contentType: string
  body: Buffer
}

export interface ListPropertyOwnersInput {
  actorTenantId: string
  actorRole: UserRole
  page?: number
  pageSize?: number
}

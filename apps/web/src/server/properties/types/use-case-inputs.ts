import type { Papel } from '@server/auth/domain/user.entity'
import type { NewProperty, PropertyChanges, PropertyListFilters } from './property'

export type CreatePropertyInput = Omit<NewProperty, 'tenantId' | 'responsavelId'> & {
  actorTenantId: string
  actorUserId: string
  actorPapel: Papel
}

export type DeletePropertyInput = {
  actorTenantId: string
  actorId: string
  id: string
  actorPapel: Papel
}

export type GetPropertyInput = {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  id: string
}

export type ListPropertiesInput = Omit<
  PropertyListFilters,
  'tenantId' | 'responsavelId' | 'renterId' | 'proprietarioId'
> & {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
}

export type PublishPropertyInput = {
  actorTenantId: string
  actorId: string
  id: string
  publishedAt?: Date
  actorPapel: Papel
}

export type TransitionPropertyFromActiveContractInput = {
  actorTenantId: string
  contractId: string
}

export type UnpublishPropertyInput = {
  actorTenantId: string
  actorId: string
  id: string
  actorPapel: Papel
}

export type UpdatePropertyInput = PropertyChanges & {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  id: string
}

export interface UploadPropertyMediaUseCaseInput {
  actorTenantId: string
  actorPapel: Papel
  filename: string
  contentType: string
  body: Buffer
}

export interface ListPropertyOwnersInput {
  actorTenantId: string
  actorPapel: Papel
  page?: number
  pageSize?: number
}

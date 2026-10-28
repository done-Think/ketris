import type { UserRole } from '@server/auth/domain/user.entity'
import type { PublicPropertyDetail } from './property'
import type { AgencyProfileDraft } from './agency-profile'
import type { BrokerProfileDraft } from './broker-profile'
import type {
  PropertySearchFilters,
  PropertySearchPage,
  PropertySearchResult,
} from './property-search'
import type { CreatedInquiry } from './inquiry'
export interface GetAgencyProfileInput {
  id?: string
  slug?: string
  creci?: string
}

export interface GetBrokerProfileInput {
  id: string
}

export interface GetOwnAgencyProfileInput {
  actorTenantId: string
  actorRole: UserRole
}

export interface GetOwnBrokerProfileInput {
  actorId: string
  actorRole: UserRole
}

export interface GetPropertyInput {
  propertyId: string
}

export type GetPropertyOutput = PublicPropertyDetail

export interface PublishAgencyProfileInput {
  actorId?: string
  actorTenantId: string
  actorRole: UserRole
}

export interface PublishBrokerProfileInput {
  actorId: string
  actorRole: UserRole
}

export interface SaveAgencyProfileInput extends AgencyProfileDraft {
  actorId?: string
  actorTenantId: string
  actorRole: UserRole
}

export interface SaveBrokerProfileInput extends BrokerProfileDraft {
  actorId: string
  actorRole: UserRole
}

export type SearchPropertiesInput = PropertySearchFilters & PropertySearchPage

export type SearchPropertiesOutput = PropertySearchResult & PropertySearchPage

export interface SubmitInquiryInput {
  website?: string
  propertyId: string
  leadName: string
  leadEmail: string
  leadPhone?: string
  proposedValue?: number
  notes?: string
}

export type SubmitInquiryOutput = CreatedInquiry

export interface UnpublishAgencyProfileInput {
  actorId?: string
  actorTenantId: string
  actorRole: UserRole
}

export interface UnpublishBrokerProfileInput {
  actorId: string
  actorRole: UserRole
}

export type ProfileMediaTarget = 'broker-avatar' | 'broker-banner' | 'agency-logo' | 'agency-banner'

export interface UploadProfileMediaUseCaseInput {
  actorId: string
  actorTenantId: string
  actorRole: UserRole
  target: ProfileMediaTarget
  filename: string
  contentType: string
  body: Buffer
}

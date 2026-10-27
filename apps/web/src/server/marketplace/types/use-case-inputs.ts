import type { Papel } from '@server/auth/domain/user.entity'
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
  actorPapel: Papel
}

export interface GetOwnBrokerProfileInput {
  actorId: string
  actorPapel: Papel
}

export interface GetPropertyInput {
  propertyId: string
}

export type GetPropertyOutput = PublicPropertyDetail

export interface PublishAgencyProfileInput {
  actorTenantId: string
  actorPapel: Papel
}

export interface PublishBrokerProfileInput {
  actorId: string
  actorPapel: Papel
}

export interface SaveAgencyProfileInput extends AgencyProfileDraft {
  actorTenantId: string
  actorPapel: Papel
}

export interface SaveBrokerProfileInput extends BrokerProfileDraft {
  actorId: string
  actorPapel: Papel
}

export type SearchPropertiesInput = PropertySearchFilters & PropertySearchPage

export type SearchPropertiesOutput = PropertySearchResult & PropertySearchPage

export interface SubmitInquiryInput {
  propertyId: string
  leadName: string
  leadEmail: string
  leadPhone?: string
  proposedValue?: number
  notes?: string
}

export type SubmitInquiryOutput = CreatedInquiry

export interface UnpublishAgencyProfileInput {
  actorTenantId: string
  actorPapel: Papel
}

export interface UnpublishBrokerProfileInput {
  actorId: string
  actorPapel: Papel
}

export type ProfileMediaTarget = 'broker-avatar' | 'broker-banner' | 'agency-logo' | 'agency-banner'

export interface UploadProfileMediaUseCaseInput {
  actorId: string
  actorTenantId: string
  actorPapel: Papel
  target: ProfileMediaTarget
  filename: string
  contentType: string
  body: Buffer
}

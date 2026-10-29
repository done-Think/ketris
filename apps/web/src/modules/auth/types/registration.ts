import type { ReactNode } from 'react'
import type { z } from 'zod'
import type { ConfirmSignupVerificationResponseDTO } from '@shared/types/generated/auth/http'
type PendingEmailVerificationOutput = RegisterResponseDTO
import type { RegisterResponseDTO } from '@shared/types/generated/registration/http'

import type { createRegistrationDetailsSchema } from '../schemas/registration-details-schema'

export type RegistrationDetailsFormValues = z.infer<
  ReturnType<typeof createRegistrationDetailsSchema>
>

export type RegistrationProfileId = 'owner' | 'broker' | 'agency' | 'developer' | 'renter'

export type RegistrationProfileIcon = 'owner' | 'broker' | 'agency' | 'developer' | 'tenant'

export type RegistrationProfile = {
  id: RegistrationProfileId
  icon: RegistrationProfileIcon
}

export type AuthRoute = '/login' | '/register' | '/register/details' | '/forgot-password'

export type RegistrationProfileFormValues = {
  profile: RegistrationProfileId
}

export type RegistrationPasswordFieldName = 'password' | 'passwordConfirmation'

export type RegistrationPasswordField = {
  name: RegistrationPasswordFieldName
  translationKey: RegistrationPasswordFieldName
}

export type RegistrationProgressProps = {
  currentStep: number
  totalSteps: number
}

export type RegistrationShellProps = RegistrationProgressProps & {
  children: ReactNode
}

export type RegistrationFormShellProps = RegistrationProgressProps & {
  children: ReactNode
  title: string
}

export type RegistrationProfileIconProps = {
  variant: RegistrationProfileIcon
}

export type RegistrationProfileCardProps = {
  profile: RegistrationProfile
  selected: boolean
  title: string
  description: string
}

export type RegistrationProfileStepProps = {
  isAdvancing: boolean
  onContinue: (profile: RegistrationProfileId) => void
}

export type RegistrationDetailsFormProps = {
  profile: RegistrationProfileId
  onSubmit?: (values: RegistrationDetailsFormValues) => void
}

export interface AgencySearchResult {
  id: string
  name: string
}

export interface SearchAgenciesResponse {
  tenants: AgencySearchResult[]
}

export type AgencyAutocompleteProps = {
  value: AgencySearchResult | null
  onChange: (agency: AgencySearchResult | null) => void
}

export type RegistrationDetailsScreenProps = {
  profile: RegistrationProfileId
}

export type EmailVerificationStepProps = {
  verification: PendingEmailVerificationOutput
  onConfirmed: (response: ConfirmSignupVerificationResponseDTO) => Promise<unknown>
}

export interface RegisterErrorBody {
  error?: { code?: string }
}

export type RegisterResponseBody = RegisterResponseDTO

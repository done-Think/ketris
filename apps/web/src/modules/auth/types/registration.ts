import type { ReactNode } from 'react'

export type { RegistrationDetailsFormValues } from '../schemas/registration-details-schema'

import type { RegistrationDetailsFormValues } from '../schemas/registration-details-schema'

export type RegistrationProfileId =
  'proprietario' | 'corretor' | 'imobiliaria' | 'construtora' | 'locatario'

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

export type AgencyAutocompleteProps = {
  value: AgencySearchResult | null
  onChange: (agency: AgencySearchResult | null) => void
}

export type RegistrationDetailsScreenProps = {
  profile: RegistrationProfileId
}

export type EmailVerificationStepProps = {
  email: string
  onConfirmed: () => void
}

export interface RegisterErrorBody {
  error?: { code?: string }
}

export interface RegisteredBody {
  outcome: 'REGISTERED'
  user: { role: string }
  accessToken: string
  refreshToken: string
}

export interface PendingApprovalBody {
  outcome: 'PENDING_APPROVAL'
  email: string
}

export type RegisterResponseBody = RegisteredBody | PendingApprovalBody

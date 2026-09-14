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

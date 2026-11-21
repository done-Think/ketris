import type {
  AgencyBrandColorField,
  AgencyBrandFormValues,
  AgencyBrandRequiredField,
  AgencyBrandReviewKey,
  AgencyBrandWizardStep,
} from '../types/agency-brand-editor'

export const agencyBrandColorFields: readonly AgencyBrandColorField[] = [
  'backgroundColor',
  'primaryColor',
  'secondaryColor',
]

// What the profile needs before it can be published, in the order of the setup steps.
export const agencyBrandRequiredFields: readonly AgencyBrandRequiredField[] = [
  'logoUrl',
  'backgroundColor',
  'bannerUrl',
]

export const agencyBrandReviewKeys: Record<AgencyBrandRequiredField, AgencyBrandReviewKey> = {
  logoUrl: 'logo',
  backgroundColor: 'background',
  bannerUrl: 'cover',
}

export const agencyBrandWizardSteps: readonly AgencyBrandWizardStep[] = [
  'logo',
  'colors',
  'cover',
  'review',
]

// Fields checked before leaving a step, so an invalid value never reaches "Aplicar" unseen.
export const agencyBrandWizardStepFields: Partial<
  Record<AgencyBrandWizardStep, readonly (keyof AgencyBrandFormValues)[]>
> = {
  colors: agencyBrandColorFields,
}

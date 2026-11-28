import type { Control, FieldErrors } from 'react-hook-form'
import type { z } from 'zod'

import type { createAgencyBrandEditorSchema } from '../schemas/agency-public-profile-editor-schema'
import type { AgencyProfile } from './agency'

export type AgencyBrandFormValues = z.infer<ReturnType<typeof createAgencyBrandEditorSchema>>

export type AgencyBrandColorField = 'backgroundColor' | 'primaryColor' | 'secondaryColor'

export type AgencyBrandPaletteId =
  'ketris' | 'ocean' | 'forest' | 'terracotta' | 'graphite' | 'wine'

export type AgencyBrandRequiredField = 'backgroundColor' | 'logoUrl' | 'bannerUrl'

export type AgencyBrandPalette = {
  id: AgencyBrandPaletteId
  backgroundColor: string
  primaryColor: string
  secondaryColor: string
}

export type AgencyBrandContrastIssue = {
  kind: 'nameOnBackground' | 'textOnPrimary'
  ratio: number
  suggestion: 'darker' | 'lighter'
}

export type AgencyBrandPreviewTab = 'profile' | 'card'

export type AgencyBrandSuggestedPalette = Pick<AgencyBrandPalette, AgencyBrandColorField>

export type AgencyBrandDialogMode = 'wizard' | 'panel'

export type AgencyBrandWizardStep = 'logo' | 'colors' | 'cover' | 'review'

export type AgencyBrandReviewKey = 'logo' | 'background' | 'cover'

export type LogoColorSample = {
  count: number
  hex: string
  saturation: number
  lightness: number
}

export type AgencyBrandSummaryCardProps = {
  agency: AgencyProfile
  values: AgencyBrandFormValues
  errors: FieldErrors<AgencyBrandFormValues>
  disabled: boolean
  onOpen: () => void
}

export type AgencyBrandDialogProps = {
  open: boolean
  initialMode: AgencyBrandDialogMode
  initialValues: AgencyBrandFormValues
  buildPreview: (values: AgencyBrandFormValues) => AgencyProfile
  onClose: () => void
  onApply: (values: AgencyBrandFormValues) => void
}

export type AgencyBrandDialogContentProps = Omit<AgencyBrandDialogProps, 'open'>

export type AgencyBrandColorFieldsProps = {
  control: Control<AgencyBrandFormValues>
  values: AgencyBrandFormValues
  suggestion: AgencyBrandSuggestedPalette | null
  onApplyPalette: (palette: AgencyBrandSuggestedPalette) => void
  onHighlight: (field: AgencyBrandColorField | null) => void
}

export type AgencyBrandColorFieldProps = {
  control: Control<AgencyBrandFormValues>
  name: AgencyBrandColorField
  onHighlight: (field: AgencyBrandColorField | null) => void
}

export type AgencyBrandPreviewProps = {
  agency: AgencyProfile
  highlightedColor: AgencyBrandColorField | null
}

export type AgencyBrandImageFieldProps = {
  control: Control<AgencyBrandFormValues>
  name: 'logoUrl' | 'bannerUrl'
}

export type AgencyBrandReviewProps = {
  values: AgencyBrandFormValues
}

export type AgencyBrandWizardStepProps = {
  step: AgencyBrandWizardStep
  control: Control<AgencyBrandFormValues>
  values: AgencyBrandFormValues
  suggestion: AgencyBrandSuggestedPalette | null
  onApplyPalette: (palette: AgencyBrandSuggestedPalette) => void
  onHighlight: (field: AgencyBrandColorField | null) => void
}

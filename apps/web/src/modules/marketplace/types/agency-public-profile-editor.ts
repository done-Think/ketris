import type { PointerEventHandler } from 'react'
import type { Control } from 'react-hook-form'
import type { DropzoneState } from 'react-dropzone'

export type AgencyPublicProfileSectionKey = 'brand' | 'metrics' | 'contact' | 'team' | 'listings'
export type AgencyPublicProfileSectionSlotKey = AgencyPublicProfileSectionKey | 'none'
export type AgencyPublicProfileImageFieldName = 'logoUrl' | 'bannerUrl'

export type AgencyPublicProfileEditorFormValues = {
  displayName: string
  headline: string
  summary: string
  legalCreci: string
  headquarters: string
  address: string
  coverage: string
  segments: string
  primaryColor: string
  accentColor: string
  backgroundColor: string
  logoUrl: string
  bannerUrl: string
  sectionOrder: AgencyPublicProfileSectionSlotKey[]
}

export type AgencyPublicProfileSectionOption = {
  key: AgencyPublicProfileSectionSlotKey
  label: string
  description: string
}

export type AgencyPublicProfileImageFieldConfig = {
  fieldName: AgencyPublicProfileImageFieldName
  label: string
  uploadLabel: string
  dropzone: DropzoneState
  previewVariant: 'logo' | 'banner'
}

export type AgencyPublicProfileMainFieldsProps = {
  control: Control<AgencyPublicProfileEditorFormValues>
}

export type AgencyPublicProfileImageFieldsProps = {
  control: Control<AgencyPublicProfileEditorFormValues>
  imageFields: AgencyPublicProfileImageFieldConfig[]
  profileDraft: AgencyPublicProfileEditorFormValues
}

export type AgencyPublicProfileEditorActionsProps = {
  onPreview: () => void
}

export type AgencyPublicProfileMiniSectionProps = {
  profileDraft: AgencyPublicProfileEditorFormValues
  sectionKey: AgencyPublicProfileSectionKey
}

export type AgencyPublicProfilePreviewDialogProps = {
  isOpen: boolean
  onClose: () => void
  profileDraft: AgencyPublicProfileEditorFormValues
  visibleSectionOrder: AgencyPublicProfileSectionKey[]
}

export type AgencyPublicProfileDemonstrativeProps = {
  draggedPosition: number | null
  finishLongPress: PointerEventHandler<HTMLDivElement>
  isTouchLikeDevice: boolean
  moveLongPress: PointerEventHandler<HTMLDivElement>
  pressedPosition: number | null
  profileDraft: AgencyPublicProfileEditorFormValues
  resetLongPress: () => void
  setDraggedPosition: (position: number | null) => void
  startLongPress: (sectionPosition: number) => PointerEventHandler<HTMLDivElement>
  swapSectionPositions: (fromPosition: number, toPosition: number) => void
  visibleSectionOrder: AgencyPublicProfileSectionKey[]
}

export type AgencyPublicProfileOrderPanelProps = AgencyPublicProfileDemonstrativeProps & {
  control: Control<AgencyPublicProfileEditorFormValues>
  updateSectionOrder: (position: number, nextSection: AgencyPublicProfileSectionSlotKey) => void
}

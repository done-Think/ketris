import type { PointerEventHandler } from 'react'
import type { Control, UseFieldArrayAppend, UseFieldArrayRemove } from 'react-hook-form'
import type { DropzoneState } from 'react-dropzone'

export type PublicProfileSectionKey = 'hero' | 'metrics' | 'team' | 'listings' | 'contact'
export type PublicProfileSectionSlotKey = PublicProfileSectionKey | 'none'
export type PublicProfileImageFieldName = 'avatarUrl' | 'bannerUrl'

export type PublicProfileTeamMember = {
  name: string
  role: string
  avatarUrl: string
  profileUrl: string
}

export type PublicProfileEditorFormValues = {
  displayName: string
  headline: string
  summary: string
  primaryColor: string
  accentColor: string
  backgroundColor: string
  avatarUrl: string
  bannerUrl: string
  teamMembers: PublicProfileTeamMember[]
  sectionOrder: PublicProfileSectionSlotKey[]
}

export type PublicProfileSectionOption = {
  key: PublicProfileSectionSlotKey
  label: string
  description: string
}

export type PublicProfileImageFieldConfig = {
  fieldName: PublicProfileImageFieldName
  label: string
  uploadLabel: string
  dropzone: DropzoneState
  previewVariant: 'avatar' | 'banner'
}

export type PublicProfileImageFieldsProps = {
  control: Control<PublicProfileEditorFormValues>
  imageFields: PublicProfileImageFieldConfig[]
  profileDraft: PublicProfileEditorFormValues
}

export type PublicProfileMainFieldsProps = {
  control: Control<PublicProfileEditorFormValues>
}

export type PublicProfileTeamFieldsProps = {
  appendTeamMember: UseFieldArrayAppend<PublicProfileEditorFormValues, 'teamMembers'>
  control: Control<PublicProfileEditorFormValues>
  removeTeamMember: UseFieldArrayRemove
  teamFields: Array<{ id: string }>
}

export type PublicProfileEditorActionsProps = {
  onPreview: () => void
}

export type PublicProfileMiniSectionProps = {
  profileDraft: PublicProfileEditorFormValues
  sectionKey: PublicProfileSectionKey
}

export type PublicProfileSectionPreviewDialogProps = {
  isOpen: boolean
  onClose: () => void
  profileDraft: PublicProfileEditorFormValues
  visibleSectionOrder: PublicProfileSectionKey[]
}

export type PublicProfileDragHandlers = {
  onPointerDown: PointerEventHandler<HTMLDivElement>
  onPointerMove: PointerEventHandler<HTMLDivElement>
  onPointerUp: PointerEventHandler<HTMLDivElement>
  onPointerCancel: () => void
}

export type PublicProfileDemonstrativeProps = {
  draggedPosition: number | null
  isTouchLikeDevice: boolean
  pressedPosition: number | null
  profileDraft: PublicProfileEditorFormValues
  resetLongPress: () => void
  setDraggedPosition: (position: number | null) => void
  startLongPress: (sectionPosition: number) => PointerEventHandler<HTMLDivElement>
  moveLongPress: PointerEventHandler<HTMLDivElement>
  finishLongPress: PointerEventHandler<HTMLDivElement>
  swapSectionPositions: (fromPosition: number, toPosition: number) => void
  visibleSectionOrder: PublicProfileSectionKey[]
}

export type PublicProfileOrderPanelProps = {
  control: Control<PublicProfileEditorFormValues>
  draggedPosition: number | null
  isTouchLikeDevice: boolean
  pressedPosition: number | null
  profileDraft: PublicProfileEditorFormValues
  resetLongPress: () => void
  setDraggedPosition: (position: number | null) => void
  startLongPress: (sectionPosition: number) => PointerEventHandler<HTMLDivElement>
  moveLongPress: PointerEventHandler<HTMLDivElement>
  finishLongPress: PointerEventHandler<HTMLDivElement>
  swapSectionPositions: (fromPosition: number, toPosition: number) => void
  updateSectionOrder: (position: number, nextSection: PublicProfileSectionSlotKey) => void
}

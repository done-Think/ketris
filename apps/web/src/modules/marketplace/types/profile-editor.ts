import type { UseMutationResult } from '@tanstack/react-query'
import type { FormEventHandler, ReactNode } from 'react'
import type { FieldValues } from 'react-hook-form'
import type { ZodType, z } from 'zod'

import type { PublicAgencyProfile } from './public-agency-profile'
import type { PublicBrokerProfile } from './public-broker-profile'
import type { createAgencyPublicProfileEditorSchema } from '../schemas/agency-public-profile-editor-schema'
import type { createPublicProfileEditorSchema } from '../schemas/public-profile-editor-schema'

export type AgencyPublicProfileEditorFormValues = z.infer<
  ReturnType<typeof createAgencyPublicProfileEditorSchema>
>

export type PublicProfileEditorFormValues = z.infer<
  ReturnType<typeof createPublicProfileEditorSchema>
>

export type PublicProfileStatus = 'DRAFT' | 'PUBLISHED'

export type PublicProfileEditorMessages = {
  saveSuccess: string
  saveError: string
  publishSuccess: string
  publishError: string
  unpublishSuccess: string
}

export type UsePublicProfileEditorParams<TValues extends FieldValues, TDraft, TProfile> = {
  status: PublicProfileStatus | null
  defaultValues: TValues
  schema: ZodType<TValues>
  publishSchema: ZodType<TValues>
  toDraft: (values: TValues) => TDraft
  save: UseMutationResult<TProfile, Error, TDraft>
  publish: UseMutationResult<TProfile, Error, void>
  unpublish: UseMutationResult<TProfile, Error, void>
  messages: PublicProfileEditorMessages
}

export type PublicProfileEditorShellProps = {
  formId: string
  title: string
  subtitle: string
  labels: {
    preview: string
    edit: string
    save: string
    publish: string
    unpublish: string
    validatedDraft: string
  }
  status: PublicProfileStatus | null
  isEditing: boolean
  isSaving: boolean
  isTogglingPublish: boolean
  showValidated: boolean
  onEdit: () => void
  onTogglePublish: () => void
  onSubmit: FormEventHandler<HTMLFormElement>
  previewOpen: boolean
  onOpenPreview: () => void
  onClosePreview: () => void
  preview: ReactNode
  children: ReactNode
}

export type PublicProfileEditorPanelProps = {
  title: string
  children: ReactNode
  fullRow?: boolean
}

export type PublicProfileEditorLoaderProps = {
  isPending: boolean
  isError: boolean
  errorLabel: string
  retryLabel: string
  onRetry: () => void
  children: ReactNode
}

export type BrokerProfileEditorProps = {
  profile: PublicBrokerProfile | null
}

export type AgencyProfileEditorProps = {
  profile: PublicAgencyProfile | null
}

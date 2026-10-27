import type { PointerEventHandler } from 'react'
import type { FieldValues, Resolver } from 'react-hook-form'
import type { z } from 'zod'

import type { createAgencyPublicProfileEditorSchema } from '../schemas/agency-public-profile-editor-schema'
import type { createPublicProfileEditorSchema } from '../schemas/public-profile-editor-schema'

export type AgencyPublicProfileEditorFormValues = z.infer<
  ReturnType<typeof createAgencyPublicProfileEditorSchema>
>

export type PublicProfileEditorFormValues = z.infer<
  ReturnType<typeof createPublicProfileEditorSchema>
>

export type ProfileEditorSetSectionOrder<TSectionSlot extends string> = (
  sectionOrder: TSectionSlot[],
) => void

export type UseProfileEditorSectionOrderParams<TSectionSlot extends string> = {
  sectionOrder: TSectionSlot[]
  setSectionOrder: ProfileEditorSetSectionOrder<TSectionSlot>
}

export type UseProfileEditorSectionOrderResult<TSectionSlot extends string> = {
  draggedPosition: number | null
  finishLongPress: PointerEventHandler<HTMLDivElement>
  isTouchLikeDevice: boolean
  moveLongPress: PointerEventHandler<HTMLDivElement>
  pressedPosition: number | null
  resetLongPress: () => void
  setDraggedPosition: (position: number | null) => void
  startLongPress: (sectionPosition: number) => PointerEventHandler<HTMLDivElement>
  swapSectionPositions: (fromPosition: number, toPosition: number) => void
  updateSectionOrder: (position: number, nextSection: TSectionSlot) => void
}

export type UseProfileEditorImageUploadParams<TFieldName extends string> = {
  setImageValue: (fieldName: TFieldName, previewUrl: string) => void
}

export type UseProfileEditorImageUploadResult<TFieldName extends string> = {
  updateImageFromFile: (fieldName: TFieldName, acceptedFiles: File[]) => void
}

type ProfileEditorMutation<TVariables> = {
  mutate: (
    variables: TVariables,
    options?: { onSuccess?: () => void; onError?: () => void },
  ) => void
  isPending: boolean
}

export type PublicProfileEditorMessage =
  'saveSuccess' | 'saveError' | 'publishSuccess' | 'publishError' | 'unpublishSuccess'

export type UsePublicProfileEditorParams<
  TValues extends FieldValues,
  TDraft,
  TProfile extends { status: string },
> = {
  profile: TProfile | null | undefined
  toFormValues: (profile: TProfile | null) => TValues
  toDraft: (values: TValues) => TDraft
  resolver: Resolver<TValues>
  publishSchema: z.ZodTypeAny
  save: ProfileEditorMutation<TDraft>
  publish: ProfileEditorMutation<void>
  unpublish: ProfileEditorMutation<void>
  messages: (key: PublicProfileEditorMessage) => string
}

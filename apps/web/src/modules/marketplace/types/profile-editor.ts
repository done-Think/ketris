import type { PointerEventHandler } from 'react'

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

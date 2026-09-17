'use client'

import { useCallback, useEffect, useRef } from 'react'

import type {
  UseProfileEditorImageUploadParams,
  UseProfileEditorImageUploadResult,
} from '../types/profile-editor'

export function useProfileEditorImageUpload<TFieldName extends string>({
  setImageValue,
}: UseProfileEditorImageUploadParams<TFieldName>): UseProfileEditorImageUploadResult<TFieldName> {
  const uploadedImageUrlsRef = useRef<Partial<Record<TFieldName, string>>>({})

  const updateImageFromFile = useCallback(
    (fieldName: TFieldName, acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0]

      if (!selectedFile) return

      const previousPreviewUrl = uploadedImageUrlsRef.current[fieldName]

      if (previousPreviewUrl) {
        URL.revokeObjectURL(previousPreviewUrl)
      }

      const previewUrl = URL.createObjectURL(selectedFile)

      uploadedImageUrlsRef.current[fieldName] = previewUrl
      setImageValue(fieldName, previewUrl)
    },
    [setImageValue],
  )

  useEffect(
    () => () => {
      Object.values(uploadedImageUrlsRef.current).forEach((previewUrl) => {
        if (typeof previewUrl === 'string') URL.revokeObjectURL(previewUrl)
      })
    },
    [],
  )

  return { updateImageFromFile }
}

import type { FieldPath, FieldValues, UseControllerProps } from 'react-hook-form'

import type { ProfileMediaTarget } from './profile-media'

export type SingleImageUploadFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = UseControllerProps<TFieldValues, TName> & {
  target: ProfileMediaTarget
  label: string
  hint?: string
  variant?: 'avatar' | 'banner'
  disabled?: boolean
}

export type ImageDropzoneProps = {
  label: string
  value: string
  isUploading: boolean
  variant: 'avatar' | 'banner'
  disabled: boolean
  error?: string
  hint?: string
  onDrop: (files: File[]) => void
  onRemove: () => void
}

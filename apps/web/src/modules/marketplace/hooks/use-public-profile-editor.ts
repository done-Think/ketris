'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { type DefaultValues, type FieldValues, type Path, useForm } from 'react-hook-form'

import type { UsePublicProfileEditorParams } from '../types/profile-editor'

export function usePublicProfileEditor<TValues extends FieldValues, TDraft, TProfile>({
  status,
  defaultValues,
  schema,
  publishSchema,
  toDraft,
  save,
  publish,
  unpublish,
  messages,
}: UsePublicProfileEditorParams<TValues, TDraft, TProfile>) {
  const { enqueueSnackbar } = useSnackbar()
  const [isEditing, setIsEditing] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const form = useForm<TValues>({
    defaultValues: defaultValues as DefaultValues<TValues>,
    resolver: zodResolver(schema),
  })
  const { handleSubmit, setError } = form

  const notifyError = (message: string) => () => enqueueSnackbar(message, { variant: 'error' })

  const onSubmit = handleSubmit((values) =>
    save.mutate(toDraft(values), {
      onSuccess: () => {
        enqueueSnackbar(messages.saveSuccess, { variant: 'success' })
        setIsEditing(false)
      },
      onError: notifyError(messages.saveError),
    }),
  )

  const publishProfile = handleSubmit((values) => {
    const check = publishSchema.safeParse(values)
    if (!check.success) {
      setIsEditing(true)
      for (const issue of check.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string') setError(field as Path<TValues>, { message: issue.message })
      }
      return
    }

    save.mutate(toDraft(values), {
      onSuccess: () =>
        publish.mutate(undefined, {
          onSuccess: () => {
            enqueueSnackbar(messages.publishSuccess, { variant: 'success' })
            setIsEditing(false)
          },
          onError: notifyError(messages.publishError),
        }),
      onError: notifyError(messages.saveError),
    })
  })

  const togglePublish = () => {
    if (status === 'PUBLISHED') {
      unpublish.mutate(undefined, {
        onSuccess: () => enqueueSnackbar(messages.unpublishSuccess, { variant: 'success' }),
        onError: notifyError(messages.publishError),
      })
      return
    }

    void publishProfile()
  }

  return {
    form,
    isEditing,
    startEditing: () => setIsEditing(true),
    isPreviewOpen,
    openPreview: () => setIsPreviewOpen(true),
    closePreview: () => setIsPreviewOpen(false),
    onSubmit,
    togglePublish,
    isSaving: save.isPending,
    isTogglingPublish: publish.isPending || unpublish.isPending,
  }
}

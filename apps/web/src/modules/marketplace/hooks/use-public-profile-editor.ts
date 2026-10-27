'use client'

import { useMemo, useState } from 'react'
import { useSnackbar } from 'notistack'
import { useForm, type FieldValues, type Path } from 'react-hook-form'

import type { UsePublicProfileEditorParams } from '../types/profile-editor'

// Shared by the broker and agency editors: edit mode, preview, saving and publishing. Publishing
// first validates the fields a public page needs, then saves the draft and publishes it.
export function usePublicProfileEditor<
  TValues extends FieldValues,
  TDraft,
  TProfile extends { status: string },
>({
  profile,
  toFormValues,
  toDraft,
  resolver,
  publishSchema,
  save,
  publish,
  unpublish,
  messages,
}: UsePublicProfileEditorParams<TValues, TDraft, TProfile>) {
  const { enqueueSnackbar } = useSnackbar()
  const [isEditing, setIsEditing] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  // `values` keeps the form in sync with the saved profile, without a reset effect.
  const values = useMemo(() => toFormValues(profile ?? null), [profile, toFormValues])
  const form = useForm<TValues>({ values, resolver })
  const isPublished = profile?.status === 'PUBLISHED'

  function saveDraft(formValues: TValues) {
    save.mutate(toDraft(formValues), {
      onSuccess: () => {
        enqueueSnackbar(messages('saveSuccess'), { variant: 'success' })
        setIsEditing(false)
      },
      onError: () => enqueueSnackbar(messages('saveError'), { variant: 'error' }),
    })
  }

  const saveAndPublish = form.handleSubmit((formValues) => {
    const publishCheck = publishSchema.safeParse(formValues)

    if (!publishCheck.success) {
      setIsEditing(true)
      for (const issue of publishCheck.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string')
          form.setError(field as Path<TValues>, { message: issue.message })
      }
      return
    }

    save.mutate(toDraft(formValues), {
      onSuccess: () =>
        publish.mutate(undefined, {
          onSuccess: () => {
            enqueueSnackbar(messages('publishSuccess'), { variant: 'success' })
            setIsEditing(false)
          },
          onError: () => enqueueSnackbar(messages('publishError'), { variant: 'error' }),
        }),
      onError: () => enqueueSnackbar(messages('saveError'), { variant: 'error' }),
    })
  })

  function togglePublished() {
    if (!isPublished) {
      void saveAndPublish()
      return
    }

    unpublish.mutate(undefined, {
      onSuccess: () => enqueueSnackbar(messages('unpublishSuccess'), { variant: 'success' }),
      onError: () => enqueueSnackbar(messages('publishError'), { variant: 'error' }),
    })
  }

  return {
    form,
    draft: form.watch(),
    isEditing,
    startEditing: () => setIsEditing(true),
    isPreviewOpen,
    openPreview: () => setIsPreviewOpen(true),
    closePreview: () => setIsPreviewOpen(false),
    submit: form.handleSubmit(saveDraft),
    togglePublished,
    isPublished,
    isSaving: save.isPending,
    isTogglingPublished: publish.isPending || unpublish.isPending,
  }
}

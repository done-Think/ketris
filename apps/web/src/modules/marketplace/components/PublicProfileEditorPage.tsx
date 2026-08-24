'use client'

import { type PointerEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDropzone } from 'react-dropzone'
import { Box, Stack, Typography } from '@mui/material'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'

import { brand, iconSize } from '@shared/theme/tokens'

import {
  PublicProfileAppearanceFields,
  PublicProfileEditorActions,
  PublicProfileImageFields,
  PublicProfileMainFields,
  PublicProfileTeamFields,
} from './public-profile-editor/PublicProfileEditorFormSections'
import { PublicProfileDemonstrative } from './public-profile-editor/PublicProfileDemonstrative'
import { PublicProfileOrderPanel } from './public-profile-editor/PublicProfileOrderPanel'
import { PublicProfileSectionPreviewDialog } from './public-profile-editor/PublicProfilePreviewDialog'
import { isPublicProfileSectionKey } from './public-profile-editor/public-profile-editor-shared'
import { publicProfileEditorDefaultValues } from '../data/public-profile-editor'
import { publicProfileEditorSchema } from '../schemas/public-profile-editor-schema'
import type {
  PublicProfileEditorFormValues,
  PublicProfileImageFieldName,
} from '../types/public-profile-editor'

export function PublicProfileEditorPage() {
  const [draggedPosition, setDraggedPosition] = useState<number | null>(null)
  const [pressedPosition, setPressedPosition] = useState<number | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isTouchLikeDevice, setIsTouchLikeDevice] = useState(false)
  const draggedPositionRef = useRef<number | null>(null)
  const uploadedImageUrlsRef = useRef<Partial<Record<PublicProfileImageFieldName, string>>>({})
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null)
  const {
    control,
    formState: { isSubmitSuccessful },
    handleSubmit,
    setValue,
    watch,
  } = useForm<PublicProfileEditorFormValues>({
    defaultValues: publicProfileEditorDefaultValues,
    resolver: zodResolver(publicProfileEditorSchema),
  })
  const {
    append: appendTeamMember,
    fields: teamFields,
    remove: removeTeamMember,
  } = useFieldArray({
    control,
    name: 'teamMembers',
  })
  const profileDraft = watch()
  const visibleSectionOrder = profileDraft.sectionOrder.filter(isPublicProfileSectionKey)

  useEffect(() => {
    const coarsePointerQuery = window.matchMedia('(pointer: coarse)')
    const updateTouchLikeDevice = () => {
      setIsTouchLikeDevice(coarsePointerQuery.matches || navigator.maxTouchPoints > 0)
    }

    updateTouchLikeDevice()
    coarsePointerQuery.addEventListener('change', updateTouchLikeDevice)

    return () => coarsePointerQuery.removeEventListener('change', updateTouchLikeDevice)
  }, [])

  useEffect(() => {
    draggedPositionRef.current = draggedPosition
  }, [draggedPosition])

  useEffect(() => {
    if (!isTouchLikeDevice || draggedPosition === null) return undefined

    const previousBodyOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
    }
  }, [draggedPosition, isTouchLikeDevice])

  const updateImageFromFile = useCallback(
    (fieldName: PublicProfileImageFieldName, acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0]

      if (!selectedFile) return

      const previousPreviewUrl = uploadedImageUrlsRef.current[fieldName]

      if (previousPreviewUrl) {
        URL.revokeObjectURL(previousPreviewUrl)
      }

      const previewUrl = URL.createObjectURL(selectedFile)

      uploadedImageUrlsRef.current[fieldName] = previewUrl
      setValue(fieldName, previewUrl, { shouldDirty: true, shouldValidate: true })
    },
    [setValue],
  )

  useEffect(
    () => () => {
      Object.values(uploadedImageUrlsRef.current).forEach((previewUrl) => {
        if (previewUrl) URL.revokeObjectURL(previewUrl)
      })
    },
    [],
  )

  const avatarDropzone = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    multiple: false,
    onDrop: (acceptedFiles) => updateImageFromFile('avatarUrl', acceptedFiles),
  })
  const bannerDropzone = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    multiple: false,
    onDrop: (acceptedFiles) => updateImageFromFile('bannerUrl', acceptedFiles),
  })

  const updateSectionOrder = (
    position: number,
    nextSection: PublicProfileEditorFormValues['sectionOrder'][number],
  ) => {
    const currentOrder = [...profileDraft.sectionOrder]
    const previousSection = currentOrder[position]
    const nextSectionPosition = currentOrder.indexOf(nextSection)

    currentOrder[position] = nextSection
    if (nextSection !== 'none' && nextSectionPosition >= 0) {
      currentOrder[nextSectionPosition] = previousSection
    }

    setValue('sectionOrder', currentOrder, { shouldDirty: true, shouldValidate: true })
  }

  const swapSectionPositions = (fromPosition: number, toPosition: number) => {
    if (fromPosition === toPosition) return

    const currentOrder = [...profileDraft.sectionOrder]
    const movedSection = currentOrder[fromPosition]

    currentOrder[fromPosition] = currentOrder[toPosition]
    currentOrder[toPosition] = movedSection

    setValue('sectionOrder', currentOrder, { shouldDirty: true, shouldValidate: true })
  }

  const clearLongPressTimer = useCallback(() => {
    if (!longPressTimerRef.current) return

    clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = null
  }, [])

  const resetLongPress = useCallback(() => {
    clearLongPressTimer()
    longPressStartRef.current = null
    draggedPositionRef.current = null
    setPressedPosition(null)
    setDraggedPosition(null)
  }, [clearLongPressTimer])

  useEffect(() => {
    window.addEventListener('blur', resetLongPress)
    window.addEventListener('pointercancel', resetLongPress)

    return () => {
      resetLongPress()
      window.removeEventListener('blur', resetLongPress)
      window.removeEventListener('pointercancel', resetLongPress)
    }
  }, [resetLongPress])

  const startLongPress = (sectionPosition: number) => (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return

    clearLongPressTimer()
    longPressStartRef.current = { x: event.clientX, y: event.clientY }
    setPressedPosition(sectionPosition)
    event.currentTarget.setPointerCapture(event.pointerId)
    longPressTimerRef.current = setTimeout(() => {
      draggedPositionRef.current = sectionPosition
      setPressedPosition(null)
      setDraggedPosition(sectionPosition)
    }, 2000)
  }

  const moveLongPress = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return

    const startPoint = longPressStartRef.current

    if (draggedPositionRef.current === null && startPoint) {
      const movedDistance = Math.hypot(event.clientX - startPoint.x, event.clientY - startPoint.y)

      if (movedDistance > 10) {
        clearLongPressTimer()
        setPressedPosition(null)
      }

      return
    }

    if (draggedPositionRef.current === null) return

    event.preventDefault()
  }

  const finishLongPress = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return

    clearLongPressTimer()
    longPressStartRef.current = null
    setPressedPosition(null)

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const activeDraggedPosition = draggedPositionRef.current

    if (activeDraggedPosition === null) return

    const targetElement = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-profile-preview-position]')
    const targetPosition = Number(targetElement?.dataset.profilePreviewPosition)

    if (Number.isInteger(targetPosition)) {
      swapSectionPositions(activeDraggedPosition, targetPosition)
    }

    draggedPositionRef.current = null
    setDraggedPosition(null)
  }

  const handleStaticSubmit = () => undefined

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 3.6 }, py: { xs: 2.4, md: 4.2 } }}>
      <Box sx={{ width: '100%' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'flex-end' }}
          spacing={2}
          sx={{ mb: 2.6 }}
        >
          <Box>
            <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 38 }, fontWeight: 900 }}>
              Editar Perfil
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: { xs: 14, md: 16 }, mt: 0.5 }}>
              Ajuste aparência, imagens e ordem das seções exibidas para visitantes.
            </Typography>
          </Box>
          {isSubmitSuccessful ? (
            <Stack
              direction="row"
              spacing={0.8}
              alignItems="center"
              sx={{ color: brand.semantic.success }}
            >
              <CheckCircleOutlineRoundedIcon sx={{ fontSize: iconSize.md }} />
              <Typography sx={{ fontSize: 13, fontWeight: 800 }}>Rascunho validado</Typography>
            </Stack>
          ) : null}
        </Stack>

        <Box
          component="form"
          onSubmit={handleSubmit(handleStaticSubmit)}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.35fr) minmax(360px, 0.65fr)' },
              gap: 2,
              alignItems: 'start',
            }}
          >
            <Stack spacing={2}>
              <PublicProfileMainFields control={control} />
              <PublicProfileTeamFields
                appendTeamMember={appendTeamMember}
                control={control}
                removeTeamMember={removeTeamMember}
                teamFields={teamFields}
              />
            </Stack>
            <Stack spacing={2}>
              <PublicProfileAppearanceFields control={control} />
              <PublicProfileImageFields
                control={control}
                imageFields={[
                  {
                    fieldName: 'avatarUrl',
                    label: 'URL da foto',
                    uploadLabel: 'Enviar foto de perfil',
                    dropzone: avatarDropzone,
                    previewVariant: 'avatar',
                  },
                  {
                    fieldName: 'bannerUrl',
                    label: 'URL do banner',
                    uploadLabel: 'Enviar banner',
                    dropzone: bannerDropzone,
                    previewVariant: 'banner',
                  },
                ]}
                profileDraft={profileDraft}
              />
              <PublicProfileEditorActions onPreview={() => setIsPreviewOpen(true)} />
            </Stack>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 410px' },
              gap: 2,
              alignItems: 'start',
            }}
          >
            <PublicProfileDemonstrative
              draggedPosition={draggedPosition}
              finishLongPress={finishLongPress}
              isTouchLikeDevice={isTouchLikeDevice}
              moveLongPress={moveLongPress}
              pressedPosition={pressedPosition}
              profileDraft={profileDraft}
              resetLongPress={resetLongPress}
              setDraggedPosition={setDraggedPosition}
              startLongPress={startLongPress}
              swapSectionPositions={swapSectionPositions}
              visibleSectionOrder={visibleSectionOrder}
            />
            <PublicProfileOrderPanel
              control={control}
              draggedPosition={draggedPosition}
              finishLongPress={finishLongPress}
              isTouchLikeDevice={isTouchLikeDevice}
              moveLongPress={moveLongPress}
              pressedPosition={pressedPosition}
              profileDraft={profileDraft}
              resetLongPress={resetLongPress}
              setDraggedPosition={setDraggedPosition}
              startLongPress={startLongPress}
              swapSectionPositions={swapSectionPositions}
              updateSectionOrder={updateSectionOrder}
            />
          </Box>
        </Box>
      </Box>

      <PublicProfileSectionPreviewDialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        profileDraft={profileDraft}
        visibleSectionOrder={visibleSectionOrder}
      />
    </Box>
  )
}

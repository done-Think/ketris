'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Avatar, Box, CircularProgress, IconButton, Stack, Typography } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import {
  Controller,
  type FieldPath,
  type FieldValues,
  type UseControllerProps,
} from 'react-hook-form'
import { useSnackbar } from 'notistack'
import { useTranslations } from 'next-intl'

import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'

import { useUploadProfileMedia } from '../../hooks/use-profile-media'
import type { ProfileMediaTarget } from '../../services/profile-media-service'

const ACCEPTED_TYPES = { 'image/jpeg': [], 'image/png': [], 'image/webp': [] }

type SingleImageUploadFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = UseControllerProps<TFieldValues, TName> & {
  target: ProfileMediaTarget
  label: string
  variant?: 'avatar' | 'banner'
}

export function SingleImageUploadField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  target,
  label,
  variant = 'banner',
}: SingleImageUploadFieldProps<TFieldValues, TName>) {
  const t = useTranslations('marketplace.mediaUpload')
  const { enqueueSnackbar } = useSnackbar()
  const { mutateAsync: uploadMedia, isPending } = useUploadProfileMedia()

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const value = typeof field.value === 'string' ? field.value : ''

        async function handleDrop(files: File[]) {
          const file = files[0]

          if (!file) return

          try {
            const url = await uploadMedia({ file, target })

            field.onChange(url)
          } catch {
            enqueueSnackbar(t('uploadError'), { variant: 'error' })
          }
        }

        return (
          <ImageDropzone
            label={label}
            value={value}
            isUploading={isPending}
            variant={variant}
            onDrop={handleDrop}
            onRemove={() => field.onChange('')}
          />
        )
      }}
    />
  )
}

function ImageDropzone({
  label,
  value,
  isUploading,
  variant,
  onDrop,
  onRemove,
}: {
  label: string
  value: string
  isUploading: boolean
  variant: 'avatar' | 'banner'
  onDrop: (files: File[]) => void
  onRemove: () => void
}) {
  const t = useTranslations('marketplace.mediaUpload')
  const handleDrop = useCallback((acceptedFiles: File[]) => onDrop(acceptedFiles), [onDrop])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: ACCEPTED_TYPES,
    multiple: false,
  })

  return (
    <Stack spacing={1}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary' }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={1.6} alignItems="center">
        {value ? (
          variant === 'avatar' ? (
            <Avatar src={value} alt="" sx={{ width: 58, height: 58, flex: '0 0 auto' }} />
          ) : (
            <Box
              component="img"
              src={value}
              alt=""
              sx={{
                width: 104,
                height: 58,
                objectFit: 'cover',
                borderRadius: `${radius.sm}px`,
                flex: '0 0 auto',
              }}
            />
          )
        ) : null}

        <Box
          {...getRootProps()}
          sx={{
            flex: 1,
            minHeight: 58,
            border: '1px dashed',
            borderColor: isDragActive ? 'primary.main' : 'divider',
            borderRadius: `${radius.sm}px`,
            bgcolor: isDragActive ? alpha.magenta[6] : surface.app,
            display: 'grid',
            placeItems: 'center',
            px: 1.4,
            py: 1,
            textAlign: 'center',
            cursor: 'pointer',
          }}
        >
          <input {...getInputProps()} aria-label={label} />
          <Stack direction="row" spacing={0.8} alignItems="center">
            {isUploading ? (
              <CircularProgress size={iconSize.md} />
            ) : (
              <CloudUploadOutlinedIcon sx={{ color: brand.neutral[500], fontSize: iconSize.md }} />
            )}
            <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 800 }}>
              {isUploading ? t('uploading') : isDragActive ? t('dragActive') : t('dropzone')}
            </Typography>
          </Stack>
        </Box>

        {value ? (
          <IconButton aria-label={t('remove')} onClick={onRemove} size="small">
            <CloseRoundedIcon sx={{ fontSize: iconSize.sm }} />
          </IconButton>
        ) : null}
      </Stack>
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{t('hint')}</Typography>
    </Stack>
  )
}

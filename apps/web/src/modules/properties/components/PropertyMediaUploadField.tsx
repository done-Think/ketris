import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Box, CircularProgress, IconButton, Stack, Typography } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import { Controller, type Control } from 'react-hook-form'
import { useSnackbar } from 'notistack'
import { useTranslations } from 'next-intl'

import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'

import { useUploadPropertyMedia } from '../hooks/use-properties'
import type { CreateDashboardPropertyFormValues } from '../types/dashboard-property'

const ACCEPTED_TYPES = { 'image/jpeg': [], 'image/png': [], 'image/webp': [] }

export function PropertyMediaUploadField({
  control,
}: {
  control: Control<CreateDashboardPropertyFormValues>
}) {
  const t = useTranslations('properties.create')
  const { enqueueSnackbar } = useSnackbar()
  const { mutateAsync: uploadMedia, isPending } = useUploadPropertyMedia()

  return (
    <Controller
      control={control}
      name="media"
      render={({ field }) => {
        const items = field.value

        return (
          <MediaDropzone
            items={items}
            isUploading={isPending}
            onDrop={async (files) => {
              const baseItems = field.value
              const results = await Promise.allSettled(files.map((file) => uploadMedia(file)))
              const uploaded = results.flatMap((result) =>
                result.status === 'fulfilled' ? [result.value] : [],
              )

              if (results.some((result) => result.status === 'rejected')) {
                enqueueSnackbar(t('mediaUploadError'), { variant: 'error' })
              }

              if (uploaded.length > 0) {
                field.onChange([
                  ...baseItems,
                  ...uploaded.map((item, index) => ({ ...item, order: baseItems.length + index })),
                ])
              }
            }}
            onRemove={(index) => {
              field.onChange(items.filter((_, itemIndex) => itemIndex !== index))
            }}
          />
        )
      }}
    />
  )
}

function MediaDropzone({
  items,
  isUploading,
  onDrop,
  onRemove,
}: {
  items: CreateDashboardPropertyFormValues['media']
  isUploading: boolean
  onDrop: (files: File[]) => void
  onRemove: (index: number) => void
}) {
  const t = useTranslations('properties.create')
  const handleDrop = useCallback((acceptedFiles: File[]) => onDrop(acceptedFiles), [onDrop])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: ACCEPTED_TYPES,
    multiple: true,
  })

  return (
    <Stack spacing={2}>
      <Box
        {...getRootProps()}
        sx={{
          minHeight: 150,
          border: '1px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          borderRadius: `${radius.sm}px`,
          bgcolor: isDragActive ? alpha.magenta[6] : surface.paper,
          display: 'grid',
          placeItems: 'center',
          px: 2,
          textAlign: 'center',
          cursor: 'pointer',
        }}
      >
        <input {...getInputProps()} />
        <Stack spacing={0.8} alignItems="center">
          {isUploading ? (
            <CircularProgress size={iconSize.xl} />
          ) : (
            <CloudUploadOutlinedIcon sx={{ color: brand.neutral[500], fontSize: iconSize.xl }} />
          )}
          <Typography sx={{ color: brand.neutral[500], fontWeight: 900 }}>
            {isUploading ? t('mediaUploading') : t('mediaDropzone')}
          </Typography>
        </Stack>
      </Box>

      {items.length > 0 ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' },
            gap: 1.6,
          }}
        >
          {items.map((item, index) => (
            <Box key={`${item.url}-${index}`} sx={{ position: 'relative' }}>
              <Box
                component="img"
                src={item.url}
                alt=""
                sx={{
                  display: 'block',
                  width: '100%',
                  aspectRatio: '1 / 1',
                  objectFit: 'cover',
                  borderRadius: `${radius.sm}px`,
                }}
              />
              <IconButton
                aria-label={t('mediaRemove')}
                onClick={() => onRemove(index)}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                }}
              >
                <CloseRoundedIcon sx={{ fontSize: iconSize.sm }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      ) : null}
    </Stack>
  )
}

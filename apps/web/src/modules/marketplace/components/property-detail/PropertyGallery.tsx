'use client'

import { Box } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, radius, surface } from '@shared/theme/tokens'

import type { PropertyGalleryProps } from '../../types/property-detail'

export function PropertyGallery({ onOpenPhoto, property }: PropertyGalleryProps) {
  const t = useTranslations('marketplace.propertyDetail.gallery')
  const [cover, ...thumbs] = property.gallery
  const hiddenPhotosCount = Math.max(property.gallery.length - 4, 0)
  const hiddenPhotosLabel = t('hiddenPhotos', { count: hiddenPhotosCount })

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 230px' },
        gap: 1,
        mb: 3,
      }}
    >
      <Box
        component="button"
        type="button"
        aria-label={t('openGallery')}
        onClick={() => onOpenPhoto(0)}
        sx={{
          minHeight: { xs: 300, md: 470 },
          borderRadius: `${radius.sm}px`,
          backgroundImage: `url("${cover}")`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          border: 0,
          cursor: 'pointer',
          display: 'block',
          p: 0,
          width: '100%',
        }}
      />
      <Box
        sx={{
          display: { xs: 'none', md: 'grid' },
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: 1,
        }}
      >
        {thumbs.slice(0, 3).map((image, index) => (
          <Box
            component="button"
            type="button"
            key={image}
            aria-label={t('openPhoto', { index: index + 2, total: property.gallery.length })}
            onClick={() => onOpenPhoto(index + 1)}
            sx={{
              position: 'relative',
              borderRadius: `${radius.sm}px`,
              backgroundImage: `url("${image}")`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              border: 0,
              cursor: 'pointer',
              overflow: 'hidden',
              p: 0,
            }}
          >
            {index === 2 ? (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: alpha.graphite[52],
                  color: surface.lightText,
                  fontWeight: 900,
                }}
              >
                {hiddenPhotosCount ? hiddenPhotosLabel : t('viewPhotos')}
              </Box>
            ) : null}
          </Box>
        ))}
      </Box>
    </Box>
  )
}

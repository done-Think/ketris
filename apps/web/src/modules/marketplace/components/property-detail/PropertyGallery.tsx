'use client'

import { Box } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { PropertyGalleryProps } from '../../types/property-detail'
import { styles, getBoxStyles, getBoxStyles2 } from '../../styles/property-gallery.styles'

export function PropertyGallery({ onOpenPhoto, property }: PropertyGalleryProps) {
  const t = useTranslations('marketplace.propertyDetail.gallery')
  const [cover, ...thumbs] = property.gallery
  const hiddenPhotosCount = Math.max(property.gallery.length - 4, 0)
  const hiddenPhotosLabel = t('hiddenPhotos', { count: hiddenPhotosCount })

  return (
    <Box sx={styles.box}>
      <Box
        component="button"
        type="button"
        aria-label={t('openGallery')}
        onClick={() => onOpenPhoto(0)}
        sx={getBoxStyles({ cover })}
      />
      <Box sx={styles.box2}>
        {thumbs.slice(0, 3).map((image, index) => (
          <Box
            component="button"
            type="button"
            key={image}
            aria-label={t('openPhoto', { index: index + 2, total: property.gallery.length })}
            onClick={() => onOpenPhoto(index + 1)}
            sx={getBoxStyles2({ image })}
          >
            {index === 2 ? (
              <Box sx={styles.box3}>{hiddenPhotosCount ? hiddenPhotosLabel : t('viewPhotos')}</Box>
            ) : null}
          </Box>
        ))}
      </Box>
    </Box>
  )
}

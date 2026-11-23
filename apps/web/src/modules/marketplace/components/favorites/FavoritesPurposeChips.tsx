'use client'

import { Chip, Stack } from '@mui/material'
import { useTranslations } from 'next-intl'

import { favoritesPurposeFilters } from '../../config/favorites'
import type { FavoritesPurposeChipsProps } from '../../types/favorite-property'

export function FavoritesPurposeChips({ counts, value, onChange }: FavoritesPurposeChipsProps) {
  const t = useTranslations('marketplace.favorites.page.purpose')

  return (
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
      {favoritesPurposeFilters.map((purpose) => (
        <Chip
          key={purpose}
          label={t(purpose, { count: counts[purpose] })}
          color={value === purpose ? 'secondary' : 'default'}
          variant={value === purpose ? 'filled' : 'outlined'}
          aria-pressed={value === purpose}
          onClick={() => onChange(purpose)}
        />
      ))}
    </Stack>
  )
}

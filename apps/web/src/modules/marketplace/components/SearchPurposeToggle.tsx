'use client'

import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { SearchPurposeToggleProps } from '../types/search'
import { getGroupStyles, styles } from '../styles/search-purpose-toggle.styles'

export function SearchPurposeToggle({ purpose, onChange, fullWidth }: SearchPurposeToggleProps) {
  const t = useTranslations('marketplace.home.search.purpose')

  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={purpose}
      aria-label={t('label')}
      onChange={(_event, next) => {
        if (next) onChange(next)
      }}
      sx={getGroupStyles(fullWidth)}
    >
      <ToggleButton value="rent" sx={styles.button}>
        {t('rent')}
      </ToggleButton>
      <ToggleButton value="buy" sx={styles.button}>
        {t('buy')}
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

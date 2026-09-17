'use client'

import { Box, MenuItem, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, componentText } from '@shared/theme/tokens'

import {
  areaFilterOptions,
  bedroomFilterOptions,
  moreFilterOptions,
  priceFilterOptions,
  propertyTypeFilterOptions,
} from '../../config/search-results-filters'
import type { QuickFilterKey } from '../../types/search'

type SearchResultsFilterMenuProps = {
  areaFilterIndex: number
  bedroomFilterIndex: number
  customMaxPrice: string
  customMinArea: string
  filterKey: QuickFilterKey
  onlyWithParking: boolean
  priceFilterIndex: number
  propertyTypeFilter: string
  setActiveQuickFilter: (filterKey: QuickFilterKey | null) => void
  setAreaFilterIndex: (index: number) => void
  setBedroomFilterIndex: (index: number) => void
  setCustomMaxPrice: (value: string) => void
  setCustomMinArea: (value: string) => void
  setOnlyWithParking: (value: boolean) => void
  setPriceFilterIndex: (index: number) => void
  setPropertyTypeFilter: (value: string) => void
}

export function SearchResultsFilterMenu({
  areaFilterIndex,
  bedroomFilterIndex,
  customMaxPrice,
  customMinArea,
  filterKey,
  onlyWithParking,
  priceFilterIndex,
  propertyTypeFilter,
  setActiveQuickFilter,
  setAreaFilterIndex,
  setBedroomFilterIndex,
  setCustomMaxPrice,
  setCustomMinArea,
  setOnlyWithParking,
  setPriceFilterIndex,
  setPropertyTypeFilter,
}: SearchResultsFilterMenuProps) {
  const t = useTranslations('marketplace.searchResults.filters')
  const quickFilterMenuItemSx = {
    ...componentText.menuItem,
    '&.Mui-selected': {
      bgcolor: alpha.magenta[10],
    },
  }

  if (filterKey === 'type') {
    return propertyTypeFilterOptions.map((option) => (
      <MenuItem
        key={option}
        selected={option === 'Todos os tipos' ? !propertyTypeFilter : propertyTypeFilter === option}
        onClick={() => {
          setPropertyTypeFilter(option === 'Todos os tipos' ? '' : option)
          setActiveQuickFilter(null)
        }}
        sx={quickFilterMenuItemSx}
      >
        {t(`options.${option}`)}
      </MenuItem>
    ))
  }

  if (filterKey === 'price') {
    return (
      <>
        {priceFilterOptions.map((option, optionIndex) => (
          <MenuItem
            key={option.label}
            selected={!customMaxPrice && priceFilterIndex === optionIndex}
            onClick={() => {
              setCustomMaxPrice('')
              setPriceFilterIndex(optionIndex)
              setActiveQuickFilter(null)
            }}
            sx={quickFilterMenuItemSx}
          >
            {t(`options.${option.label}`)}
          </MenuItem>
        ))}
        <Box sx={{ px: 1.2, py: 1 }}>
          <TextField
            autoFocus
            fullWidth
            label={t('maxPrice')}
            type="number"
            size="small"
            value={customMaxPrice}
            onChange={(event) => {
              setCustomMaxPrice(event.target.value)
              setPriceFilterIndex(0)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') setActiveQuickFilter(null)
            }}
            slotProps={{ htmlInput: { min: 0, step: 500 } }}
          />
        </Box>
      </>
    )
  }

  if (filterKey === 'bedrooms') {
    return bedroomFilterOptions.map((option, optionIndex) => (
      <MenuItem
        key={option.label}
        selected={bedroomFilterIndex === optionIndex}
        onClick={() => {
          setBedroomFilterIndex(optionIndex)
          setActiveQuickFilter(null)
        }}
        sx={quickFilterMenuItemSx}
      >
        {t(`options.${option.label}`)}
      </MenuItem>
    ))
  }

  if (filterKey === 'area') {
    return (
      <>
        {areaFilterOptions.map((option, optionIndex) => (
          <MenuItem
            key={option.label}
            selected={!customMinArea && areaFilterIndex === optionIndex}
            onClick={() => {
              setCustomMinArea('')
              setAreaFilterIndex(optionIndex)
              setActiveQuickFilter(null)
            }}
            sx={quickFilterMenuItemSx}
          >
            {t(`options.${option.label}`)}
          </MenuItem>
        ))}
        <Box sx={{ px: 1.2, py: 1 }}>
          <TextField
            autoFocus
            fullWidth
            label={t('minArea')}
            type="number"
            size="small"
            value={customMinArea}
            onChange={(event) => {
              setCustomMinArea(event.target.value)
              setAreaFilterIndex(0)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') setActiveQuickFilter(null)
            }}
            slotProps={{ htmlInput: { min: 0, step: 10 } }}
          />
        </Box>
      </>
    )
  }

  return moreFilterOptions.map((option) => (
    <MenuItem
      key={option.label}
      selected={onlyWithParking === option.onlyWithParking}
      onClick={() => {
        setOnlyWithParking(option.onlyWithParking)
        setActiveQuickFilter(null)
      }}
      sx={quickFilterMenuItemSx}
    >
      {t(`options.${option.label}`)}
    </MenuItem>
  ))
}

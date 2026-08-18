'use client'

import { Box, MenuItem } from '@mui/material'
import { useWatch } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'
import { alpha, componentText } from '@shared/theme/tokens'

import {
  areaFilterOptions,
  bedroomFilterOptions,
  moreFilterOptions,
  priceFilterOptions,
  propertyTypeFilterOptions,
} from '../../config/search-results-filters'
import type { SearchResultsFilterMenuProps } from '../../types/search-results'

export function SearchResultsFilterMenu({
  areaFilterIndex,
  bedroomFilterIndex,
  control,
  filterKey,
  onlyWithParking,
  priceFilterIndex,
  propertyTypeFilter,
  setActiveQuickFilter,
  setFilterValue,
}: SearchResultsFilterMenuProps) {
  const customMaxPrice = useWatch({ control, name: 'customMaxPrice' })
  const customMinArea = useWatch({ control, name: 'customMinArea' })
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
          setFilterValue('propertyTypeFilter', option === 'Todos os tipos' ? '' : option)
          setActiveQuickFilter(null)
        }}
        sx={quickFilterMenuItemSx}
      >
        {option}
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
              setFilterValue('customMaxPrice', '')
              setFilterValue('priceFilterIndex', optionIndex)
              setActiveQuickFilter(null)
            }}
            sx={quickFilterMenuItemSx}
          >
            {option.label}
          </MenuItem>
        ))}
        <Box sx={{ px: 1.2, py: 1 }}>
          <RhfTextField
            autoFocus
            fullWidth
            control={control}
            name="customMaxPrice"
            label="Preço máximo"
            type="number"
            size="small"
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
          setFilterValue('bedroomFilterIndex', optionIndex)
          setActiveQuickFilter(null)
        }}
        sx={quickFilterMenuItemSx}
      >
        {option.label}
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
              setFilterValue('customMinArea', '')
              setFilterValue('areaFilterIndex', optionIndex)
              setActiveQuickFilter(null)
            }}
            sx={quickFilterMenuItemSx}
          >
            {option.label}
          </MenuItem>
        ))}
        <Box sx={{ px: 1.2, py: 1 }}>
          <RhfTextField
            autoFocus
            fullWidth
            control={control}
            name="customMinArea"
            label="Área mínima"
            type="number"
            size="small"
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
        setFilterValue('onlyWithParking', option.onlyWithParking)
        setActiveQuickFilter(null)
      }}
      sx={quickFilterMenuItemSx}
    >
      {option.label}
    </MenuItem>
  ))
}

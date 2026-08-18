'use client'

import { useRef, useState } from 'react'
import { Box, Chip, Stack } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'

import { useClickAway } from '@shared/hooks'
import { alpha, iconSize, motion, radius, shadows, surface, zIndex } from '@shared/theme/tokens'

import type { QuickFilterKey } from '../../types/search'
import type { SearchResultsFiltersProps } from '../../types/search-results'
import { SearchResultsFilterMenu } from './SearchResultsFilterMenu'
import { SearchResultsLocationField } from './SearchResultsLocationField'

export function SearchResultsFilters(props: SearchResultsFiltersProps) {
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilterKey | null>(null)
  const quickFiltersRef = useRef<HTMLDivElement | null>(null)

  useClickAway([quickFiltersRef], () => setActiveQuickFilter(null), {
    enabled: activeQuickFilter !== null,
  })

  const toggleQuickFilterMenu = (filterKey: QuickFilterKey) => {
    setActiveQuickFilter((current) => (current === filterKey ? null : filterKey))
  }

  const filters = [
    {
      key: 'type' as const,
      label: props.propertyTypeFilter ? `Tipo: ${props.propertyTypeFilter}` : 'Tipo',
      active: Boolean(props.propertyTypeFilter),
      onDelete: props.propertyTypeFilter
        ? () => props.setFilterValue('propertyTypeFilter', '')
        : undefined,
    },
    {
      key: 'price' as const,
      label: props.priceFilterLabel,
      active: Boolean(props.maxPrice),
      onDelete: props.maxPrice ? props.clearPriceFilter : undefined,
    },
    {
      key: 'bedrooms' as const,
      label: props.bedroomFilterLabel,
      active: props.bedroomFilterIndex > 0,
    },
    {
      key: 'area' as const,
      label: props.areaFilterLabel,
      active: Boolean(props.minArea),
      onDelete: props.minArea ? props.clearAreaFilter : undefined,
    },
    {
      key: 'more' as const,
      label: props.onlyWithParking ? 'Com vaga' : 'Mais filtros',
      active: props.onlyWithParking,
      onDelete: props.onlyWithParking
        ? () => props.setFilterValue('onlyWithParking', false)
        : undefined,
    },
  ]

  return (
    <>
      <SearchResultsLocationField
        locationQuery={props.locationQuery}
        setFilterValue={props.setFilterValue}
      />

      <Stack
        ref={quickFiltersRef}
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
        sx={{ mb: 2 }}
      >
        {filters.map((filter) => (
          <Box key={filter.key} sx={{ position: 'relative' }}>
            <Chip
              label={filter.label}
              clickable
              onClick={() => toggleQuickFilterMenu(filter.key)}
              onDelete={filter.onDelete}
              deleteIcon={<CloseRoundedIcon />}
              sx={{
                height: 34,
                borderRadius: `${radius.sm}px`,
                borderColor: filter.active ? 'primary.main' : 'divider',
                bgcolor: filter.active ? 'primary.main' : surface.paper,
                color: filter.active ? surface.lightText : 'text.primary',
                fontWeight: 700,
                transition: motion.transition.bordered,
                '& .MuiChip-deleteIcon': {
                  color: 'inherit',
                  mr: 1,
                  fontSize: iconSize.xs,
                },
                '&:hover': {
                  bgcolor: filter.active ? 'primary.dark' : alpha.magenta[6],
                  borderColor: filter.active ? 'primary.dark' : 'primary.main',
                },
              }}
              variant={filter.active ? 'filled' : 'outlined'}
            />

            {activeQuickFilter === filter.key ? (
              <Box
                sx={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  zIndex: zIndex.dropdown,
                  minWidth: 172,
                  overflow: 'hidden',
                  borderRadius: `${radius.sm}px`,
                  bgcolor: surface.paper,
                  boxShadow: shadows.popover,
                }}
              >
                <SearchResultsFilterMenu
                  {...props}
                  filterKey={filter.key}
                  setActiveQuickFilter={setActiveQuickFilter}
                />
              </Box>
            ) : null}
          </Box>
        ))}
      </Stack>
    </>
  )
}

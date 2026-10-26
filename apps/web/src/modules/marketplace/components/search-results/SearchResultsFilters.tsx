'use client'

import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Stack } from '@mui/material'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

import { alpha, iconSize, motion, radius, surface } from '@shared/theme/tokens'

import { createSearchResultsFiltersDialogFormSchema } from '../../schemas/marketplace-search-schema'
import type {
  SearchResultsFilterButtonProps,
  SearchResultsFiltersDialogFormValues,
  SearchResultsFiltersProps,
} from '../../types/search'
import { SearchResultsFilterDialog } from './SearchResultsFilterDialog'
import { SearchResultsLocationField } from './SearchResultsLocationField'

export function SearchResultsFilters({
  locationQuery,
  setLocationQuery,
}: SearchResultsFiltersProps) {
  return (
    <SearchResultsLocationField locationQuery={locationQuery} setLocationQuery={setLocationQuery} />
  )
}

export function SearchResultsFilterButton(props: SearchResultsFilterButtonProps) {
  const t = useTranslations('marketplace.searchResults.filters')
  const [open, setOpen] = useState(false)
  const searchResultsFiltersDialogFormSchema = useMemo(
    () => createSearchResultsFiltersDialogFormSchema((key) => t(`errors.${key}`)),
    [t],
  )
  const appliedFilters: SearchResultsFiltersDialogFormValues = {
    propertyTypeFilter: props.propertyTypeFilter,
    priceFilterIndex: props.priceFilterIndex,
    customMaxPrice: props.customMaxPrice,
    bedroomFilterIndex: props.bedroomFilterIndex,
    areaFilterIndex: props.areaFilterIndex,
    customMinArea: props.customMinArea,
    onlyWithParking: props.onlyWithParking,
  }
  const { control, handleSubmit, reset, setValue } = useForm<SearchResultsFiltersDialogFormValues>({
    defaultValues: appliedFilters,
    resolver: zodResolver(searchResultsFiltersDialogFormSchema),
  })

  const activeFiltersCount = [
    props.propertyTypeFilter,
    props.maxPrice,
    props.bedroomFilterIndex > 0,
    props.minArea,
    props.onlyWithParking,
  ].filter(Boolean).length

  // The dialog edits a draft: it starts from the applied filters every time it opens.
  const openFiltersDialog = () => {
    reset(appliedFilters)
    setOpen(true)
  }

  const clearDraftFilters = () =>
    reset({
      propertyTypeFilter: '',
      priceFilterIndex: 0,
      customMaxPrice: '',
      bedroomFilterIndex: 0,
      areaFilterIndex: 0,
      customMinArea: '',
      onlyWithParking: false,
    })

  const applyDraftFilters = (values: SearchResultsFiltersDialogFormValues) => {
    props.setPropertyTypeFilter(values.propertyTypeFilter)
    props.setPriceFilterIndex(values.priceFilterIndex)
    props.setCustomMaxPrice(values.customMaxPrice)
    props.setBedroomFilterIndex(values.bedroomFilterIndex)
    props.setAreaFilterIndex(values.areaFilterIndex)
    props.setCustomMinArea(values.customMinArea)
    props.setOnlyWithParking(values.onlyWithParking)
    setOpen(false)
  }

  return (
    <>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Button
          variant={activeFiltersCount > 0 ? 'contained' : 'outlined'}
          startIcon={<TuneRoundedIcon />}
          onClick={openFiltersDialog}
          sx={{
            minHeight: 34,
            borderRadius: `${radius.sm}px`,
            bgcolor: activeFiltersCount > 0 ? 'primary.main' : surface.paper,
            color: activeFiltersCount > 0 ? surface.lightText : 'text.primary',
            borderColor: activeFiltersCount > 0 ? 'primary.main' : 'divider',
            px: 1.5,
            fontWeight: 700,
            textTransform: 'none',
            transition: motion.transition.bordered,
            '& .MuiButton-startIcon svg': {
              fontSize: iconSize.xs,
            },
            '&:hover': {
              bgcolor: activeFiltersCount > 0 ? 'primary.dark' : alpha.magenta[6],
              borderColor: activeFiltersCount > 0 ? 'primary.dark' : 'primary.main',
            },
          }}
        >
          {activeFiltersCount > 0
            ? t('buttonWithCount', { count: activeFiltersCount })
            : t('button')}
        </Button>
      </Stack>

      <SearchResultsFilterDialog
        control={control}
        setValue={setValue}
        open={open}
        clearDraftFilters={clearDraftFilters}
        closeFiltersDialog={() => setOpen(false)}
        onSubmitFilters={handleSubmit(applyDraftFilters)}
      />
    </>
  )
}

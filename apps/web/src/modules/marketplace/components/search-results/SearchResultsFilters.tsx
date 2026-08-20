'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Stack } from '@mui/material'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import { useForm } from 'react-hook-form'

import { alpha, iconSize, motion, radius, surface } from '@shared/theme/tokens'

import { searchResultsFiltersDialogFormSchema } from '../../schemas/marketplace-search-schema'
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
  const { getValues, handleSubmit, setValue, watch } =
    useForm<SearchResultsFiltersDialogFormValues>({
      defaultValues: {
        isFiltersOpen: false,
        propertyTypeFilter: props.propertyTypeFilter,
        priceFilterIndex: props.priceFilterIndex,
        customMaxPrice: props.customMaxPrice,
        bedroomFilterIndex: props.bedroomFilterIndex,
        areaFilterIndex: props.areaFilterIndex,
        customMinArea: props.customMinArea,
        onlyWithParking: props.onlyWithParking,
      },
      resolver: zodResolver(searchResultsFiltersDialogFormSchema),
    })
  const formValues = watch()

  const syncDraftWithAppliedFilters = () => {
    setValue('propertyTypeFilter', props.propertyTypeFilter)
    setValue('priceFilterIndex', props.priceFilterIndex)
    setValue('customMaxPrice', props.customMaxPrice)
    setValue('bedroomFilterIndex', props.bedroomFilterIndex)
    setValue('areaFilterIndex', props.areaFilterIndex)
    setValue('customMinArea', props.customMinArea)
    setValue('onlyWithParking', props.onlyWithParking)
  }

  const activeFiltersCount = [
    props.propertyTypeFilter,
    props.maxPrice,
    props.bedroomFilterIndex > 0,
    props.minArea,
    props.onlyWithParking,
  ].filter(Boolean).length

  const closeFiltersDialog = () => {
    setValue('isFiltersOpen', false)
  }

  const openFiltersDialog = () => {
    syncDraftWithAppliedFilters()
    setValue('isFiltersOpen', true)
  }

  const clearDraftFilters = () => {
    setValue('propertyTypeFilter', '')
    setValue('priceFilterIndex', 0)
    setValue('customMaxPrice', '')
    setValue('bedroomFilterIndex', 0)
    setValue('areaFilterIndex', 0)
    setValue('customMinArea', '')
    setValue('onlyWithParking', false)
  }

  const applyDraftFilters = () => {
    props.setPropertyTypeFilter(getValues('propertyTypeFilter'))
    props.setPriceFilterIndex(getValues('priceFilterIndex'))
    props.setCustomMaxPrice(getValues('customMaxPrice'))
    props.setBedroomFilterIndex(getValues('bedroomFilterIndex'))
    props.setAreaFilterIndex(getValues('areaFilterIndex'))
    props.setCustomMinArea(getValues('customMinArea'))
    props.setOnlyWithParking(getValues('onlyWithParking'))
    closeFiltersDialog()
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
          {activeFiltersCount > 0 ? `Filtros (${activeFiltersCount})` : 'Filtros'}
        </Button>
      </Stack>

      <SearchResultsFilterDialog
        {...formValues}
        clearDraftFilters={clearDraftFilters}
        closeFiltersDialog={closeFiltersDialog}
        onSubmitFilters={handleSubmit(applyDraftFilters)}
        setAreaFilterIndex={(value) =>
          setValue('areaFilterIndex', value, { shouldDirty: true, shouldValidate: true })
        }
        setBedroomFilterIndex={(value) =>
          setValue('bedroomFilterIndex', value, { shouldDirty: true, shouldValidate: true })
        }
        setCustomMaxPrice={(value) =>
          setValue('customMaxPrice', value, { shouldDirty: true, shouldValidate: true })
        }
        setCustomMinArea={(value) =>
          setValue('customMinArea', value, { shouldDirty: true, shouldValidate: true })
        }
        setOnlyWithParking={(value) =>
          setValue('onlyWithParking', value, { shouldDirty: true, shouldValidate: true })
        }
        setPriceFilterIndex={(value) =>
          setValue('priceFilterIndex', value, { shouldDirty: true, shouldValidate: true })
        }
        setPropertyTypeFilter={(value) =>
          setValue('propertyTypeFilter', value, { shouldDirty: true, shouldValidate: true })
        }
      />
    </>
  )
}

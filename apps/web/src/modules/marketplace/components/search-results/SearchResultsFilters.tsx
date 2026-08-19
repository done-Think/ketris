'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'

import { alpha, componentText, iconSize, motion, radius, surface } from '@shared/theme/tokens'

import {
  areaFilterOptions,
  bedroomFilterOptions,
  priceFilterOptions,
  propertyTypeFilterOptions,
} from '../../config/search-results-filters'
import {
  searchResultsFiltersSchema,
  type SearchResultsFiltersFormValues,
} from '../../schemas/search-results-filters-schema'
import { SearchResultsLocationField } from './SearchResultsLocationField'

type SearchResultsFiltersProps = {
  areaFilterIndex: number
  areaFilterLabel: string
  bedroomFilterIndex: number
  bedroomFilterLabel: string
  clearAreaFilter: () => void
  clearPriceFilter: () => void
  customMaxPrice: string
  customMinArea: string
  locationQuery: string
  maxPrice: number | null
  minArea: number | null
  onlyWithParking: boolean
  priceFilterIndex: number
  priceFilterLabel: string
  propertyTypeFilter: string
  setAreaFilterIndex: (index: number) => void
  setBedroomFilterIndex: (index: number) => void
  setCustomMaxPrice: (value: string) => void
  setCustomMinArea: (value: string) => void
  setLocationQuery: (value: string) => void
  setOnlyWithParking: (value: boolean) => void
  setPriceFilterIndex: (index: number) => void
  setPropertyTypeFilter: (value: string) => void
}

export function SearchResultsFilters(props: SearchResultsFiltersProps) {
  return (
    <SearchResultsLocationField
      locationQuery={props.locationQuery}
      setLocationQuery={props.setLocationQuery}
    />
  )
}

export function SearchResultsFilterButton(props: SearchResultsFiltersProps) {
  const { getValues, setValue, watch } = useForm<SearchResultsFiltersFormValues>({
    resolver: zodResolver(searchResultsFiltersSchema),
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
  })
  const isFiltersOpen = watch('isFiltersOpen')
  const propertyTypeFilter = watch('propertyTypeFilter')
  const priceFilterIndex = watch('priceFilterIndex')
  const customMaxPrice = watch('customMaxPrice')
  const bedroomFilterIndex = watch('bedroomFilterIndex')
  const areaFilterIndex = watch('areaFilterIndex')
  const customMinArea = watch('customMinArea')
  const onlyWithParking = watch('onlyWithParking')

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

  const fieldSx = {
    '& .MuiInputBase-root': {
      borderRadius: `${radius.sm}px`,
      bgcolor: surface.paper,
    },
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

      <Dialog
        open={isFiltersOpen}
        onClose={closeFiltersDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: `${radius.md}px`,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            pb: 1.5,
            fontWeight: 800,
          }}
        >
          Filtros
          <IconButton
            aria-label="Fechar filtros"
            onClick={closeFiltersDialog}
            sx={{ width: 36, height: 36, borderRadius: `${radius.sm}px` }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2.2} sx={{ pt: 1 }}>
            <TextField
              select
              fullWidth
              label="Tipo"
              value={propertyTypeFilter || 'Todos os tipos'}
              onChange={(event) =>
                setValue(
                  'propertyTypeFilter',
                  event.target.value === 'Todos os tipos' ? '' : event.target.value,
                )
              }
              sx={fieldSx}
            >
              {propertyTypeFilterOptions.map((option) => (
                <MenuItem key={option} value={option} sx={componentText.menuItem}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                select
                fullWidth
                label="Preço"
                value={priceFilterIndex}
                onChange={(event) => {
                  setValue('priceFilterIndex', Number(event.target.value))
                  setValue('customMaxPrice', '')
                }}
                sx={fieldSx}
              >
                {priceFilterOptions.map((option, optionIndex) => (
                  <MenuItem key={option.label} value={optionIndex} sx={componentText.menuItem}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Preço máximo"
                type="number"
                value={customMaxPrice}
                onChange={(event) => {
                  setValue('customMaxPrice', event.target.value)
                  setValue('priceFilterIndex', 0)
                }}
                inputProps={{ min: 0, step: 500 }}
                sx={fieldSx}
              />
            </Stack>

            <TextField
              select
              fullWidth
              label="Quartos"
              value={bedroomFilterIndex}
              onChange={(event) => setValue('bedroomFilterIndex', Number(event.target.value))}
              sx={fieldSx}
            >
              {bedroomFilterOptions.map((option, optionIndex) => (
                <MenuItem key={option.label} value={optionIndex} sx={componentText.menuItem}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                select
                fullWidth
                label="Área"
                value={areaFilterIndex}
                onChange={(event) => {
                  setValue('areaFilterIndex', Number(event.target.value))
                  setValue('customMinArea', '')
                }}
                sx={fieldSx}
              >
                {areaFilterOptions.map((option, optionIndex) => (
                  <MenuItem key={option.label} value={optionIndex} sx={componentText.menuItem}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Área mínima"
                type="number"
                value={customMinArea}
                onChange={(event) => {
                  setValue('customMinArea', event.target.value)
                  setValue('areaFilterIndex', 0)
                }}
                inputProps={{ min: 0, step: 10 }}
                sx={fieldSx}
              />
            </Stack>

            <Box
              sx={{
                px: 1.4,
                py: 1,
                border: 1,
                borderColor: 'divider',
                borderRadius: `${radius.sm}px`,
                bgcolor: surface.paper,
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={onlyWithParking}
                    onChange={(event) => setValue('onlyWithParking', event.target.checked)}
                  />
                }
                label="Somente imóveis com vaga"
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
          <Button onClick={clearDraftFilters} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Limpar
          </Button>
          <Button
            variant="contained"
            onClick={applyDraftFilters}
            sx={{ borderRadius: `${radius.sm}px`, textTransform: 'none', fontWeight: 800 }}
          >
            Concluir
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

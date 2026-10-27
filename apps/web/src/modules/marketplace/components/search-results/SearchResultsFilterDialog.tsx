'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
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
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'

import { marketplacePropertyTypes, propertyTypeLabelKeys } from '../../config/property-types'
import {
  areaFilterOptions,
  bedroomFilterOptions,
  priceFilterOptions,
} from '../../config/search-results-filters'
import { emptySearchResultsFilters } from '../../hooks/use-search-results'
import { createSearchResultsFiltersFormSchema } from '../../schemas/marketplace-search-schema'
import { styles } from '../../styles/search-results-filter-dialog.styles'
import type {
  SearchResultsFilterDialogProps,
  SearchResultsFilterFieldsProps,
  SearchResultsFiltersFormValues,
} from '../../types/search'

const allTypes = 'all'

export function SearchResultsFilterDialog(props: SearchResultsFilterDialogProps) {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: styles.paper } }}
    >
      {props.open ? <SearchResultsFilterForm {...props} /> : null}
    </Dialog>
  )
}

function SearchResultsFilterForm({ filters, onClose, onApply }: SearchResultsFilterDialogProps) {
  const t = useTranslations('marketplace.searchResults.filters')
  const schema = useMemo(
    () => createSearchResultsFiltersFormSchema((key) => t(`errors.${key}`)),
    [t],
  )
  const { control, handleSubmit, reset } = useForm<SearchResultsFiltersFormValues>({
    defaultValues: filters,
    resolver: zodResolver(schema),
  })

  return (
    <>
      <DialogTitle sx={styles.title}>
        {t('title')}
        <IconButton aria-label={t('close')} onClick={onClose} sx={styles.close}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <Box component="form" noValidate onSubmit={handleSubmit(onApply)}>
        <DialogContent>
          <Stack spacing={2.2} sx={styles.content}>
            <PropertyTypeField control={control} />
            <PriceFields control={control} />
            <BedroomField control={control} />
            <AreaFields control={control} />
            <ParkingField control={control} />
          </Stack>
        </DialogContent>
        <DialogActions sx={styles.actions}>
          <Button type="button" onClick={() => reset(emptySearchResultsFilters)} sx={styles.clear}>
            {t('clear')}
          </Button>
          <Button type="submit" variant="contained" sx={styles.submit}>
            {t('done')}
          </Button>
        </DialogActions>
      </Box>
    </>
  )
}

function PropertyTypeField({ control }: SearchResultsFilterFieldsProps) {
  const t = useTranslations('marketplace.searchResults.filters')
  const typeT = useTranslations('marketplace.propertyDetail.categories')

  return (
    <Controller
      control={control}
      name="propertyType"
      render={({ field }) => (
        <TextField
          select
          fullWidth
          label={t('type')}
          value={field.value ?? allTypes}
          onChange={(event) =>
            field.onChange(
              marketplacePropertyTypes.find((type) => type === event.target.value) ?? null,
            )
          }
          sx={styles.field}
        >
          <MenuItem value={allTypes} sx={styles.option}>
            {t('options.allTypes')}
          </MenuItem>
          {marketplacePropertyTypes.map((type) => (
            <MenuItem key={type} value={type} sx={styles.option}>
              {typeT(propertyTypeLabelKeys[type])}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  )
}

function PriceFields({ control }: SearchResultsFilterFieldsProps) {
  const t = useTranslations('marketplace.searchResults.filters')

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <RhfTextField
        control={control}
        name="priceOption"
        select
        fullWidth
        label={t('price')}
        sx={styles.field}
      >
        {priceFilterOptions.map((option, index) => (
          <MenuItem key={option.label} value={index} sx={styles.option}>
            {t(`options.${option.label}`)}
          </MenuItem>
        ))}
      </RhfTextField>
      <RhfTextField
        control={control}
        name="customMaxPrice"
        fullWidth
        label={t('maxPrice')}
        slotProps={{ htmlInput: { inputMode: 'numeric' } }}
        sx={styles.field}
      />
    </Stack>
  )
}

function BedroomField({ control }: SearchResultsFilterFieldsProps) {
  const t = useTranslations('marketplace.searchResults.filters')

  return (
    <RhfTextField
      control={control}
      name="bedroomOption"
      select
      fullWidth
      label={t('bedrooms')}
      sx={styles.field}
    >
      {bedroomFilterOptions.map((option, index) => (
        <MenuItem key={option.label} value={index} sx={styles.option}>
          {t(`options.${option.label}`)}
        </MenuItem>
      ))}
    </RhfTextField>
  )
}

function AreaFields({ control }: SearchResultsFilterFieldsProps) {
  const t = useTranslations('marketplace.searchResults.filters')

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <RhfTextField
        control={control}
        name="areaOption"
        select
        fullWidth
        label={t('area')}
        sx={styles.field}
      >
        {areaFilterOptions.map((option, index) => (
          <MenuItem key={option.label} value={index} sx={styles.option}>
            {t(`options.${option.label}`)}
          </MenuItem>
        ))}
      </RhfTextField>
      <RhfTextField
        control={control}
        name="customMinArea"
        fullWidth
        label={t('minArea')}
        slotProps={{ htmlInput: { inputMode: 'numeric' } }}
        sx={styles.field}
      />
    </Stack>
  )
}

function ParkingField({ control }: SearchResultsFilterFieldsProps) {
  const t = useTranslations('marketplace.searchResults.filters')

  return (
    <Box sx={styles.parking}>
      <Controller
        control={control}
        name="onlyWithParking"
        render={({ field }) => (
          <FormControlLabel
            control={
              <Switch
                checked={field.value}
                onChange={(event) => field.onChange(event.target.checked)}
              />
            }
            label={t('onlyWithParking')}
          />
        )}
      />
    </Box>
  )
}

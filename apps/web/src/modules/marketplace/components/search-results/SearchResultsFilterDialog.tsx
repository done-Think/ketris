'use client'

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
import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'

import { componentText, radius, surface } from '@shared/theme/tokens'

import {
  areaFilterOptions,
  bedroomFilterOptions,
  priceFilterOptions,
  propertyTypeFilterOptions,
} from '../../config/search-results-filters'
import type {
  SearchResultsFilterDialogProps,
  SearchResultsFilterFieldProps,
} from '../../types/search'

const fieldSx = {
  '& .MuiInputBase-root': {
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
  },
}

function SearchResultsTypeFilter({ control }: SearchResultsFilterFieldProps) {
  const t = useTranslations('marketplace.searchResults.filters')

  return (
    <Controller
      control={control}
      name="propertyTypeFilter"
      render={({ field }) => (
        <TextField
          select
          fullWidth
          label={t('type')}
          value={field.value || 'Todos os tipos'}
          onChange={(event) =>
            field.onChange(event.target.value === 'Todos os tipos' ? '' : event.target.value)
          }
          sx={fieldSx}
        >
          {propertyTypeFilterOptions.map((option) => (
            <MenuItem key={option} value={option} sx={componentText.menuItem}>
              {t(`options.${option}`)}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  )
}

// A preset range and a custom value are alternatives: choosing one clears the other.
function SearchResultsPriceFilters({ control, setValue }: SearchResultsFilterFieldProps) {
  const t = useTranslations('marketplace.searchResults.filters')

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <Controller
        control={control}
        name="priceFilterIndex"
        render={({ field }) => (
          <TextField
            {...field}
            select
            fullWidth
            label={t('price')}
            onChange={(event) => {
              field.onChange(Number(event.target.value))
              setValue('customMaxPrice', '', { shouldValidate: true })
            }}
            sx={fieldSx}
          >
            {priceFilterOptions.map((option, optionIndex) => (
              <MenuItem key={option.label} value={optionIndex} sx={componentText.menuItem}>
                {t(`options.${option.label}`)}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Controller
        control={control}
        name="customMaxPrice"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            fullWidth
            label={t('maxPrice')}
            type="number"
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
            onChange={(event) => {
              field.onChange(event.target.value)
              setValue('priceFilterIndex', 0)
            }}
            slotProps={{ htmlInput: { min: 0, step: 500 } }}
            sx={fieldSx}
          />
        )}
      />
    </Stack>
  )
}

function SearchResultsBedroomFilter({ control }: SearchResultsFilterFieldProps) {
  const t = useTranslations('marketplace.searchResults.filters')

  return (
    <Controller
      control={control}
      name="bedroomFilterIndex"
      render={({ field }) => (
        <TextField
          {...field}
          select
          fullWidth
          label={t('bedrooms')}
          onChange={(event) => field.onChange(Number(event.target.value))}
          sx={fieldSx}
        >
          {bedroomFilterOptions.map((option, optionIndex) => (
            <MenuItem key={option.label} value={optionIndex} sx={componentText.menuItem}>
              {t(`options.${option.label}`)}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  )
}

function SearchResultsAreaFilters({ control, setValue }: SearchResultsFilterFieldProps) {
  const t = useTranslations('marketplace.searchResults.filters')

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <Controller
        control={control}
        name="areaFilterIndex"
        render={({ field }) => (
          <TextField
            {...field}
            select
            fullWidth
            label={t('area')}
            onChange={(event) => {
              field.onChange(Number(event.target.value))
              setValue('customMinArea', '', { shouldValidate: true })
            }}
            sx={fieldSx}
          >
            {areaFilterOptions.map((option, optionIndex) => (
              <MenuItem key={option.label} value={optionIndex} sx={componentText.menuItem}>
                {t(`options.${option.label}`)}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Controller
        control={control}
        name="customMinArea"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            fullWidth
            label={t('minArea')}
            type="number"
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
            onChange={(event) => {
              field.onChange(event.target.value)
              setValue('areaFilterIndex', 0)
            }}
            slotProps={{ htmlInput: { min: 0, step: 10 } }}
            sx={fieldSx}
          />
        )}
      />
    </Stack>
  )
}

function SearchResultsParkingFilter({ control }: SearchResultsFilterFieldProps) {
  const t = useTranslations('marketplace.searchResults.filters')

  return (
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

export function SearchResultsFilterDialog({
  control,
  setValue,
  open,
  clearDraftFilters,
  closeFiltersDialog,
  onSubmitFilters,
}: SearchResultsFilterDialogProps) {
  const t = useTranslations('marketplace.searchResults.filters')

  return (
    <Dialog
      open={open}
      onClose={closeFiltersDialog}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${radius.md}px`,
          },
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
        {t('title')}
        <IconButton
          aria-label={t('close')}
          onClick={closeFiltersDialog}
          sx={{ width: 36, height: 36, borderRadius: `${radius.sm}px` }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <Box component="form" noValidate onSubmit={onSubmitFilters}>
        <DialogContent>
          <Stack spacing={2.2} sx={{ pt: 1 }}>
            <SearchResultsTypeFilter control={control} setValue={setValue} />
            <SearchResultsPriceFilters control={control} setValue={setValue} />
            <SearchResultsBedroomFilter control={control} setValue={setValue} />
            <SearchResultsAreaFilters control={control} setValue={setValue} />
            <SearchResultsParkingFilter control={control} setValue={setValue} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
          <Button
            type="button"
            onClick={clearDraftFilters}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {t('clear')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{ borderRadius: `${radius.sm}px`, textTransform: 'none', fontWeight: 800 }}
          >
            {t('done')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

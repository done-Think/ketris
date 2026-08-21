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

import { componentText, radius, surface } from '@shared/theme/tokens'

import {
  areaFilterOptions,
  bedroomFilterOptions,
  priceFilterOptions,
  propertyTypeFilterOptions,
} from '../../config/search-results-filters'
import type { SearchResultsFilterDialogProps } from '../../types/search'

const fieldSx = {
  '& .MuiInputBase-root': {
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
  },
}

function SearchResultsTypeFilter({
  propertyTypeFilter,
  setPropertyTypeFilter,
}: Pick<SearchResultsFilterDialogProps, 'propertyTypeFilter' | 'setPropertyTypeFilter'>) {
  return (
    <TextField
      select
      fullWidth
      label="Tipo"
      value={propertyTypeFilter || 'Todos os tipos'}
      onChange={(event) =>
        setPropertyTypeFilter(event.target.value === 'Todos os tipos' ? '' : event.target.value)
      }
      sx={fieldSx}
    >
      {propertyTypeFilterOptions.map((option) => (
        <MenuItem key={option} value={option} sx={componentText.menuItem}>
          {option}
        </MenuItem>
      ))}
    </TextField>
  )
}

function SearchResultsPriceFilters({
  customMaxPrice,
  priceFilterIndex,
  setCustomMaxPrice,
  setPriceFilterIndex,
}: Pick<
  SearchResultsFilterDialogProps,
  'customMaxPrice' | 'priceFilterIndex' | 'setCustomMaxPrice' | 'setPriceFilterIndex'
>) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <TextField
        select
        fullWidth
        label="Preço"
        value={priceFilterIndex}
        onChange={(event) => {
          setPriceFilterIndex(Number(event.target.value))
          setCustomMaxPrice('')
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
          setCustomMaxPrice(event.target.value)
          setPriceFilterIndex(0)
        }}
        slotProps={{ htmlInput: { min: 0, step: 500 } }}
        sx={fieldSx}
      />
    </Stack>
  )
}

function SearchResultsBedroomFilter({
  bedroomFilterIndex,
  setBedroomFilterIndex,
}: Pick<SearchResultsFilterDialogProps, 'bedroomFilterIndex' | 'setBedroomFilterIndex'>) {
  return (
    <TextField
      select
      fullWidth
      label="Quartos"
      value={bedroomFilterIndex}
      onChange={(event) => setBedroomFilterIndex(Number(event.target.value))}
      sx={fieldSx}
    >
      {bedroomFilterOptions.map((option, optionIndex) => (
        <MenuItem key={option.label} value={optionIndex} sx={componentText.menuItem}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  )
}

function SearchResultsAreaFilters({
  areaFilterIndex,
  customMinArea,
  setAreaFilterIndex,
  setCustomMinArea,
}: Pick<
  SearchResultsFilterDialogProps,
  'areaFilterIndex' | 'customMinArea' | 'setAreaFilterIndex' | 'setCustomMinArea'
>) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <TextField
        select
        fullWidth
        label="Área"
        value={areaFilterIndex}
        onChange={(event) => {
          setAreaFilterIndex(Number(event.target.value))
          setCustomMinArea('')
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
          setCustomMinArea(event.target.value)
          setAreaFilterIndex(0)
        }}
        slotProps={{ htmlInput: { min: 0, step: 10 } }}
        sx={fieldSx}
      />
    </Stack>
  )
}

function SearchResultsParkingFilter({
  onlyWithParking,
  setOnlyWithParking,
}: Pick<SearchResultsFilterDialogProps, 'onlyWithParking' | 'setOnlyWithParking'>) {
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
      <FormControlLabel
        control={
          <Switch
            checked={onlyWithParking}
            onChange={(event) => setOnlyWithParking(event.target.checked)}
          />
        }
        label="Somente imóveis com vaga"
      />
    </Box>
  )
}

export function SearchResultsFilterDialog({
  areaFilterIndex,
  bedroomFilterIndex,
  clearDraftFilters,
  closeFiltersDialog,
  customMaxPrice,
  customMinArea,
  isFiltersOpen,
  onSubmitFilters,
  onlyWithParking,
  priceFilterIndex,
  propertyTypeFilter,
  setAreaFilterIndex,
  setBedroomFilterIndex,
  setCustomMaxPrice,
  setCustomMinArea,
  setOnlyWithParking,
  setPriceFilterIndex,
  setPropertyTypeFilter,
}: SearchResultsFilterDialogProps) {
  return (
    <Dialog
      open={isFiltersOpen}
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
      <Box component="form" noValidate onSubmit={onSubmitFilters}>
        <DialogContent>
          <Stack spacing={2.2} sx={{ pt: 1 }}>
            <SearchResultsTypeFilter
              propertyTypeFilter={propertyTypeFilter}
              setPropertyTypeFilter={setPropertyTypeFilter}
            />
            <SearchResultsPriceFilters
              customMaxPrice={customMaxPrice}
              priceFilterIndex={priceFilterIndex}
              setCustomMaxPrice={setCustomMaxPrice}
              setPriceFilterIndex={setPriceFilterIndex}
            />
            <SearchResultsBedroomFilter
              bedroomFilterIndex={bedroomFilterIndex}
              setBedroomFilterIndex={setBedroomFilterIndex}
            />
            <SearchResultsAreaFilters
              areaFilterIndex={areaFilterIndex}
              customMinArea={customMinArea}
              setAreaFilterIndex={setAreaFilterIndex}
              setCustomMinArea={setCustomMinArea}
            />
            <SearchResultsParkingFilter
              onlyWithParking={onlyWithParking}
              setOnlyWithParking={setOnlyWithParking}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
          <Button
            type="button"
            onClick={clearDraftFilters}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Limpar
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{ borderRadius: `${radius.sm}px`, textTransform: 'none', fontWeight: 800 }}
          >
            Concluir
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

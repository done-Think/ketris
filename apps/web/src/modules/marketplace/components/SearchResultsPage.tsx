'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AppsRoundedIcon from '@mui/icons-material/AppsRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded'
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'

import { HomeHeader, ProfileModal } from '@shared/components/layout'
import {
  alpha,
  componentText,
  iconSize,
  motion,
  radius,
  shadows,
  surface,
  zIndex,
} from '@shared/theme/tokens'

import { homeNavigationItems } from '../config/navigation'
import { profileActions, userProfile } from '../data/user-profile'
import { searchResults } from '../data/search-results'
import { SearchPropertyCard } from './SearchPropertyCard'
import { SearchResultsMap } from './SearchResultsMap'

type SortOption = 'relevancia' | 'menor-preco' | 'maior-preco'
type ViewMode = 'grid' | 'list'
type QuickFilterKey = 'type' | 'price' | 'bedrooms' | 'area' | 'more'

const propertyTypeFilterOptions = [
  'Todos os tipos',
  'Apartamento',
  'Cobertura',
  'Loft',
  'Casa',
] as const

const priceFilterOptions = [
  { label: 'Preço', max: null },
  { label: 'Até R$ 6.000', max: 6000 },
  { label: 'Até R$ 10.000', max: 10000 },
] as const

const bedroomFilterOptions = [
  { label: 'Quartos', min: null },
  { label: '2+ quartos', min: 2 },
  { label: '3+ quartos', min: 3 },
] as const

const areaFilterOptions = [
  { label: 'Área', min: null },
  { label: '90m²+', min: 90 },
  { label: '100m²+', min: 100 },
] as const

const moreFilterOptions = [
  { label: 'Todos', onlyWithParking: false },
  { label: 'Com vaga', onlyWithParking: true },
] as const

type SearchResultsPageProps = {
  purpose: 'alugar' | 'comprar'
}

function getCurrencyValue(price: string) {
  const [value = '0'] = price.match(/[\d.]+/) ?? []

  return Number(value.replace(/\./g, ''))
}

function getFeatureNumber(property: (typeof searchResults)[number], key: string) {
  const detail = property.details.find((item) => item.key === key)
  const [value = '0'] = detail?.label.match(/\d+/) ?? []

  return Number(value)
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

export function SearchResultsPage({ purpose }: SearchResultsPageProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState(searchResults[0]?.id ?? '')
  const [locationQuery, setLocationQuery] = useState('')
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('')
  const [priceFilterIndex, setPriceFilterIndex] = useState(0)
  const [customMaxPrice, setCustomMaxPrice] = useState('')
  const [bedroomFilterIndex, setBedroomFilterIndex] = useState(0)
  const [areaFilterIndex, setAreaFilterIndex] = useState(0)
  const [customMinArea, setCustomMinArea] = useState('')
  const [onlyWithParking, setOnlyWithParking] = useState(false)
  const [sortOption, setSortOption] = useState<SortOption>('relevancia')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilterKey | null>(null)
  const profileButtonRef = useRef<HTMLButtonElement | null>(null)
  const navigationItems = homeNavigationItems.map((item) => ({
    ...item,
    active: item.href.includes(`finalidade=${purpose}`),
  }))
  const priceFilter = priceFilterOptions[priceFilterIndex]
  const bedroomFilter = bedroomFilterOptions[bedroomFilterIndex]
  const areaFilter = areaFilterOptions[areaFilterIndex]
  const customMaxPriceValue = Number(customMaxPrice)
  const customMinAreaValue = Number(customMinArea)
  const maxPrice = customMaxPriceValue > 0 ? customMaxPriceValue : priceFilter.max
  const minArea = customMinAreaValue > 0 ? customMinAreaValue : areaFilter.min
  const priceFilterLabel =
    customMaxPriceValue > 0
      ? `Até ${formatCompactCurrency(customMaxPriceValue)}`
      : priceFilter.label
  const areaFilterLabel = customMinAreaValue > 0 ? `${customMinAreaValue}m²+` : areaFilter.label
  const filteredResults = useMemo(() => {
    const nextResults = searchResults
      .filter((property) => property.purpose === purpose)
      .filter((property) => !locationQuery || property.location === locationQuery)
      .filter((property) => !propertyTypeFilter || property.category === propertyTypeFilter)
      .filter((property) => !maxPrice || getCurrencyValue(property.price) <= maxPrice)
      .filter(
        (property) =>
          !bedroomFilter.min || getFeatureNumber(property, 'bedrooms') >= bedroomFilter.min,
      )
      .filter((property) => !minArea || getFeatureNumber(property, 'area') >= minArea)
      .filter((property) => !onlyWithParking || getFeatureNumber(property, 'parking') > 0)

    if (sortOption === 'menor-preco') {
      return [...nextResults].sort(
        (current, next) => getCurrencyValue(current.price) - getCurrencyValue(next.price),
      )
    }

    if (sortOption === 'maior-preco') {
      return [...nextResults].sort(
        (current, next) => getCurrencyValue(next.price) - getCurrencyValue(current.price),
      )
    }

    return nextResults
  }, [
    bedroomFilter.min,
    locationQuery,
    maxPrice,
    minArea,
    onlyWithParking,
    propertyTypeFilter,
    purpose,
    sortOption,
  ])

  useEffect(() => {
    if (filteredResults.some((property) => property.id === selectedPropertyId)) return

    setSelectedPropertyId(filteredResults[0]?.id ?? '')
  }, [filteredResults, selectedPropertyId])

  const toggleQuickFilterMenu = (filterKey: QuickFilterKey) => {
    setActiveQuickFilter((current) => (current === filterKey ? null : filterKey))
  }

  const clearPriceFilter = () => {
    setCustomMaxPrice('')
    setPriceFilterIndex(0)
  }

  const clearAreaFilter = () => {
    setCustomMinArea('')
    setAreaFilterIndex(0)
  }

  const quickFilterMenuItemSx = {
    ...componentText.menuItem,
    '&.Mui-selected': {
      bgcolor: alpha.magenta[10],
    },
  }

  const renderQuickFilterOptions = (filterKey: QuickFilterKey) => {
    if (filterKey === 'type') {
      return propertyTypeFilterOptions.map((option) => (
        <MenuItem
          key={option}
          selected={
            option === 'Todos os tipos' ? !propertyTypeFilter : propertyTypeFilter === option
          }
          onClick={() => {
            setPropertyTypeFilter(option === 'Todos os tipos' ? '' : option)
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
                setCustomMaxPrice('')
                setPriceFilterIndex(optionIndex)
                setActiveQuickFilter(null)
              }}
              sx={quickFilterMenuItemSx}
            >
              {option.label}
            </MenuItem>
          ))}
          <Box sx={{ px: 1.2, py: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label="Preço máximo"
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
              inputProps={{ min: 0, step: 500 }}
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
                setCustomMinArea('')
                setAreaFilterIndex(optionIndex)
                setActiveQuickFilter(null)
              }}
              sx={quickFilterMenuItemSx}
            >
              {option.label}
            </MenuItem>
          ))}
          <Box sx={{ px: 1.2, py: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label="Área mínima"
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
              inputProps={{ min: 0, step: 10 }}
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
        {option.label}
      </MenuItem>
    ))
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100vw',
        minHeight: '100vh',
        overflowX: 'clip',
        bgcolor: surface.app,
      }}
    >
      <HomeHeader
        navigationItems={navigationItems}
        profileButtonRef={profileButtonRef}
        userProfile={userProfile}
        onToggleProfile={() => setIsProfileOpen((current) => !current)}
      />

      <ProfileModal
        open={isProfileOpen}
        anchorRef={profileButtonRef}
        actions={profileActions}
        userProfile={userProfile}
        onClose={() => setIsProfileOpen(false)}
      />

      <Box
        component="main"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.08fr) minmax(430px, 0.92fr)' },
          minHeight: 'calc(100vh - 60px)',
        }}
      >
        <Box
          sx={{
            px: { xs: 2, sm: 3, xl: 5 },
            py: { xs: 2, md: 3 },
            minWidth: 0,
          }}
        >
          <TextField
            fullWidth
            value={locationQuery || 'Todas as regiões'}
            size="small"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: 'text.primary', fontSize: iconSize.lg }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Limpar busca"
                    size="small"
                    onClick={() => setLocationQuery('')}
                  >
                    <CloseRoundedIcon sx={{ fontSize: iconSize.sm }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                minHeight: 48,
                borderRadius: `${radius.sm}px`,
                bgcolor: surface.paper,
                fontWeight: 700,
              },
            }}
          />

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
            {[
              {
                key: 'type' as const,
                label: propertyTypeFilter ? `Tipo: ${propertyTypeFilter}` : 'Tipo',
                active: Boolean(propertyTypeFilter),
                onDelete: propertyTypeFilter ? () => setPropertyTypeFilter('') : undefined,
              },
              {
                key: 'price' as const,
                label: priceFilterLabel,
                active: Boolean(maxPrice),
                onDelete: maxPrice ? clearPriceFilter : undefined,
              },
              {
                key: 'bedrooms' as const,
                label: bedroomFilter.label,
                active: bedroomFilterIndex > 0,
              },
              {
                key: 'area' as const,
                label: areaFilterLabel,
                active: Boolean(minArea),
                onDelete: minArea ? clearAreaFilter : undefined,
              },
              {
                key: 'more' as const,
                label: onlyWithParking ? 'Com vaga' : 'Mais filtros',
                active: onlyWithParking,
                onDelete: onlyWithParking ? () => setOnlyWithParking(false) : undefined,
              },
            ].map((filter) => (
              <Box
                key={filter.key}
                sx={{
                  position: 'relative',
                }}
              >
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
                    {renderQuickFilterOptions(filter.key)}
                  </Box>
                ) : null}
              </Box>
            ))}
          </Stack>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
            spacing={1.5}
            sx={{ mb: 2 }}
          >
            <Typography sx={{ color: 'text.secondary', fontWeight: 800, fontSize: 14 }}>
              {filteredResults.length} imóveis encontrados
            </Typography>

            <Stack direction="row" alignItems="center" spacing={1}>
              <TextField
                select
                size="small"
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value as SortOption)}
                sx={{
                  minWidth: 190,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: `${radius.sm}px`,
                    bgcolor: surface.paper,
                    fontSize: 12,
                    fontWeight: 700,
                  },
                }}
              >
                <MenuItem value="relevancia">Ordenar por: Relevância</MenuItem>
                <MenuItem value="menor-preco">Menor preço</MenuItem>
                <MenuItem value="maior-preco">Maior preço</MenuItem>
              </TextField>

              <IconButton
                aria-label="Visualização em grade"
                onClick={() => setViewMode('grid')}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: `${radius.sm}px`,
                  bgcolor: viewMode === 'grid' ? alpha.magenta[8] : 'transparent',
                  color: viewMode === 'grid' ? 'primary.main' : 'text.secondary',
                }}
              >
                <AppsRoundedIcon sx={{ fontSize: iconSize.md }} />
              </IconButton>
              <IconButton
                aria-label="Visualização em lista"
                onClick={() => setViewMode('list')}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: `${radius.sm}px`,
                  bgcolor: viewMode === 'list' ? alpha.magenta[8] : 'transparent',
                  color: viewMode === 'list' ? 'primary.main' : 'text.secondary',
                }}
              >
                <FormatListBulletedRoundedIcon sx={{ fontSize: iconSize.md }} />
              </IconButton>
            </Stack>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns:
                viewMode === 'grid' ? { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } : '1fr',
              gap: { xs: 2, xl: 2.5 },
            }}
          >
            {filteredResults.length ? (
              filteredResults.map((property) => (
                <SearchPropertyCard
                  key={property.id}
                  property={property}
                  selected={property.id === selectedPropertyId}
                  onActivate={() => setSelectedPropertyId(property.id)}
                />
              ))
            ) : (
              <Box
                sx={{
                  gridColumn: '1 / -1',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: `${radius.sm}px`,
                  bgcolor: surface.paper,
                  px: 2,
                  py: 4,
                  textAlign: 'center',
                }}
              >
                <Typography sx={{ fontWeight: 900, mb: 0.5 }}>Nenhum imóvel encontrado</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 700 }}>
                  Ajuste os filtros para ver mais opções.
                </Typography>
              </Box>
            )}
          </Box>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={1}
            sx={{ mt: 2.4 }}
          >
            <IconButton
              aria-label="Filtros"
              sx={{
                display: { xs: 'inline-flex', lg: 'none' },
                width: 38,
                height: 38,
                borderRadius: radius.full,
                bgcolor: surface.paper,
                boxShadow: `0 8px 20px ${alpha.graphite[8]}`,
              }}
            >
              <FilterListRoundedIcon sx={{ fontSize: iconSize.md }} />
            </IconButton>
            {[1, 2, 3].map((page) => (
              <Button
                key={page}
                size="small"
                sx={{
                  minWidth: 34,
                  width: 34,
                  height: 34,
                  borderRadius: radius.full,
                  color: page === 1 ? surface.lightText : 'text.secondary',
                  bgcolor: page === 1 ? 'primary.main' : 'transparent',
                  ...componentText.resetButtonText,
                  '&:hover': {
                    bgcolor: page === 1 ? 'primary.dark' : alpha.magenta[6],
                  },
                }}
              >
                {page}
              </Button>
            ))}
          </Stack>
        </Box>

        <Box
          sx={{
            display: { xs: 'none', lg: 'block' },
            alignSelf: 'start',
            position: { lg: 'sticky' },
            top: { lg: 68 },
            height: { lg: 'calc(100vh - 76px)' },
            minHeight: { lg: 620 },
            minWidth: 0,
            p: 1,
            pl: 0,
          }}
        >
          <SearchResultsMap
            properties={filteredResults}
            selectedPropertyId={selectedPropertyId}
            onSelectProperty={setSelectedPropertyId}
          />
        </Box>
      </Box>
    </Box>
  )
}

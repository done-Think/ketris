'use client'

import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import FmdGoodOutlinedIcon from '@mui/icons-material/FmdGoodOutlined'
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import MapOutlinedIcon from '@mui/icons-material/MapOutlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import SortRoundedIcon from '@mui/icons-material/SortRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'

import { HomeHeader } from '@/app/(public)/_components/HomeHeader'
import { ProfileModal } from '@/app/(public)/_components/ProfileModal'
import { SiteFooter } from '@/app/(public)/_components/SiteFooter'
import {
  marketplaceLocations,
  marketplaceProperties,
  marketplacePropertyTypes,
} from '../data/properties'
import type { MarketplaceProperty, PropertyType } from '../types/property'
import { PropertyCard } from './PropertyCard'

const PropertyMap = dynamic(() => import('./PropertyMap').then((module) => module.PropertyMap), {
  ssr: false,
  loading: () => (
    <Box sx={{ height: '100%', minHeight: 440, display: 'grid', placeItems: 'center' }}>
      <CircularProgress aria-label="Carregando mapa" />
    </Box>
  ),
})

type SortOption = 'recommended' | 'price-asc' | 'price-desc' | 'area-desc'
type MobileView = 'list' | 'map'

type FilterValues = {
  location: string
  propertyType: string
  bedrooms: number
  priceRange: [number, number]
}

const DEFAULT_PRICE_RANGE: [number, number] = [0, 50000]

const normalizeSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)

function parsePriceRange(value: string | null): [number, number] {
  if (!value) return DEFAULT_PRICE_RANGE

  const values = value
    .match(/\d[\d.]*/g)
    ?.map((part) => Number(part.replaceAll('.', '')))
    .filter((part) => Number.isFinite(part))

  if (!values?.length) return DEFAULT_PRICE_RANGE
  if (values.length === 1) {
    return value.toLocaleLowerCase().includes('acima')
      ? [values[0], DEFAULT_PRICE_RANGE[1]]
      : [0, values[0]]
  }

  return [Math.min(values[0], values[1]), Math.max(values[0], values[1])]
}

function isDefaultPriceRange(value: [number, number]) {
  return value[0] === DEFAULT_PRICE_RANGE[0] && value[1] === DEFAULT_PRICE_RANGE[1]
}

export function PropertiesSearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [location, setLocation] = useState(() => searchParams.get('localizacao') ?? '')
  const [propertyType, setPropertyType] = useState(() => searchParams.get('tipo') ?? '')
  const [bedrooms, setBedrooms] = useState(() => Number(searchParams.get('quartos') ?? 0))
  const [priceRange, setPriceRange] = useState<[number, number]>(() =>
    parsePriceRange(searchParams.get('preco')),
  )
  const [sort, setSort] = useState<SortOption>('recommended')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [showMap, setShowMap] = useState(true)
  const [mobileView, setMobileView] = useState<MobileView>('list')
  const [selectedProperty, setSelectedProperty] = useState<MarketplaceProperty | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  const currentFilters: FilterValues = useMemo(
    () => ({ location, propertyType, bedrooms, priceRange }),
    [location, propertyType, bedrooms, priceRange],
  )

  const filteredProperties = useMemo(() => {
    const normalizedLocation = normalizeSearchText(location)

    const results = marketplaceProperties.filter((property) => {
      const matchesLocation =
        !normalizedLocation ||
        normalizeSearchText(`${property.location} ${property.city}`).includes(normalizedLocation)
      const matchesType = !propertyType || property.type === propertyType
      const matchesBedrooms = bedrooms === 0 || property.bedrooms >= bedrooms
      const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1]

      return matchesLocation && matchesType && matchesBedrooms && matchesPrice
    })

    return [...results].sort((left, right) => {
      if (sort === 'price-asc') return left.price - right.price
      if (sort === 'price-desc') return right.price - left.price
      if (sort === 'area-desc') return right.area - left.area
      return Number(Boolean(right.isFeatured)) - Number(Boolean(left.isFeatured))
    })
  }, [bedrooms, location, priceRange, propertyType, sort])

  useEffect(() => {
    if (
      selectedProperty &&
      !filteredProperties.some((property) => property.id === selectedProperty.id)
    ) {
      setSelectedProperty(null)
    }
  }, [filteredProperties, selectedProperty])

  const activeFilterCount =
    Number(Boolean(location)) +
    Number(Boolean(propertyType)) +
    Number(bedrooms > 0) +
    Number(!isDefaultPriceRange(priceRange))

  const syncUrl = (filters: FilterValues) => {
    const params = new URLSearchParams()

    if (filters.location) params.set('localizacao', filters.location)
    if (filters.propertyType) params.set('tipo', filters.propertyType)
    if (filters.bedrooms > 0) params.set('quartos', String(filters.bedrooms))
    if (!isDefaultPriceRange(filters.priceRange)) {
      params.set('preco', `${filters.priceRange[0]}-${filters.priceRange[1]}`)
    }

    const query = params.toString()
    router.replace(query ? `/imoveis?${query}` : '/imoveis', { scroll: false })
  }

  const clearFilters = () => {
    setLocation('')
    setPropertyType('')
    setBedrooms(0)
    setPriceRange(DEFAULT_PRICE_RANGE)
    setSelectedProperty(null)
    router.replace('/imoveis', { scroll: false })
  }

  const removeFilter = (key: keyof FilterValues) => {
    const nextFilters: FilterValues = { ...currentFilters }

    if (key === 'location') {
      nextFilters.location = ''
      setLocation('')
    }
    if (key === 'propertyType') {
      nextFilters.propertyType = ''
      setPropertyType('')
    }
    if (key === 'bedrooms') {
      nextFilters.bedrooms = 0
      setBedrooms(0)
    }
    if (key === 'priceRange') {
      nextFilters.priceRange = DEFAULT_PRICE_RANGE
      setPriceRange(DEFAULT_PRICE_RANGE)
    }

    syncUrl(nextFilters)
  }

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    syncUrl(currentFilters)
  }

  const selectProperty = (property: MarketplaceProperty) => {
    setSelectedProperty(property)
    setShowMap(true)

    if (window.matchMedia('(max-width: 899px)').matches) {
      setMobileView('map')
    }
  }

  const filterDrawer = (
    <Box sx={{ width: { xs: '100vw', sm: 390 }, p: { xs: 2.5, sm: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
        <Box>
          <Typography
            variant="h5"
            sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800 }}
          >
            Filtros
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 12.5 }}>
            Refine os imóveis exibidos
          </Typography>
        </Box>
        <IconButton aria-label="Fechar filtros" onClick={() => setFiltersOpen(false)}>
          <CloseRoundedIcon />
        </IconButton>
      </Stack>

      <Divider />

      <Box sx={{ py: 3 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 900, mb: 1.4 }}>Tipo de imóvel</Typography>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {marketplacePropertyTypes.map((type) => (
            <Chip
              key={type}
              label={type}
              clickable
              color={propertyType === type ? 'primary' : 'default'}
              variant={propertyType === type ? 'filled' : 'outlined'}
              onClick={() => setPropertyType(propertyType === type ? '' : type)}
              sx={{ fontWeight: 700 }}
            />
          ))}
        </Stack>
      </Box>

      <Divider />

      <Box sx={{ py: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 900 }}>Faixa de preço mensal</Typography>
          <Typography color="primary" sx={{ fontSize: 12, fontWeight: 900 }}>
            {formatCurrency(priceRange[0])} — {formatCurrency(priceRange[1])}
          </Typography>
        </Stack>
        <Slider
          value={priceRange}
          min={0}
          max={50000}
          step={500}
          onChange={(_, value) => setPriceRange(value as [number, number])}
          valueLabelDisplay="auto"
          valueLabelFormat={formatCurrency}
          getAriaLabel={(index) => (index === 0 ? 'Preço mínimo' : 'Preço máximo')}
          sx={{ mt: 2 }}
        />
        <Stack direction="row" justifyContent="space-between">
          <Typography color="text.secondary" sx={{ fontSize: 11 }}>
            R$ 0
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 11 }}>
            R$ 50 mil+
          </Typography>
        </Stack>
      </Box>

      <Divider />

      <Box sx={{ py: 3 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 900, mb: 1.4 }}>Quartos</Typography>
        <Stack direction="row" spacing={1}>
          {[0, 1, 2, 3, 4].map((amount) => (
            <Button
              key={amount}
              variant={bedrooms === amount ? 'contained' : 'outlined'}
              color={bedrooms === amount ? 'primary' : 'secondary'}
              onClick={() => setBedrooms(amount)}
              sx={{ minWidth: 52, borderColor: 'divider' }}
            >
              {amount === 0 ? 'Todos' : `${amount}+`}
            </Button>
          ))}
        </Stack>
      </Box>

      <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
        <Button variant="outlined" color="secondary" fullWidth onClick={clearFilters}>
          Limpar
        </Button>
        <Button
          variant="contained"
          fullWidth
          onClick={() => {
            syncUrl(currentFilters)
            setFiltersOpen(false)
          }}
        >
          Ver {filteredProperties.length} imóveis
        </Button>
      </Stack>
    </Box>
  )

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F7F8FA' }}>
      <HomeHeader onOpenProfile={() => setProfileOpen(true)} activeNav="Alugar" />
      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}

      <Box
        component="section"
        sx={{
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pt: { xs: 3, md: 4.5 },
          pb: { xs: 2.5, md: 3.5 },
        }}
      >
        <Container maxWidth="xl">
          <Typography
            component="h1"
            sx={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: { xs: 27, md: 36 },
              fontWeight: 800,
              letterSpacing: '-0.035em',
              mb: 0.6,
            }}
          >
            Encontre o imóvel ideal para você
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: { xs: 13, md: 15 }, mb: 2.5 }}>
            Explore imóveis verificados e fale diretamente com corretores parceiros.
          </Typography>

          <Box
            component="form"
            onSubmit={submitSearch}
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'minmax(280px, 1.8fr) minmax(210px, 1fr) auto auto',
              },
              gap: 1.25,
              alignItems: 'stretch',
            }}
          >
            <TextField
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Cidade, bairro ou região"
              aria-label="Localização"
              inputProps={{ list: 'marketplace-locations' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FmdGoodOutlinedIcon sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': { height: 52, bgcolor: '#F7F8FA' },
              }}
            />
            <datalist id="marketplace-locations">
              {marketplaceLocations.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>

            <FormControl>
              <InputLabel id="property-type-label">Tipo de imóvel</InputLabel>
              <Select
                labelId="property-type-label"
                value={propertyType}
                label="Tipo de imóvel"
                onChange={(event) => setPropertyType(event.target.value as PropertyType | '')}
                sx={{ height: 52, bgcolor: '#F7F8FA' }}
              >
                <MenuItem value="">Todos os tipos</MenuItem>
                {marketplacePropertyTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              type="button"
              variant="outlined"
              color="secondary"
              startIcon={<TuneRoundedIcon />}
              onClick={() => setFiltersOpen(true)}
              sx={{
                minHeight: 52,
                px: 2.2,
                borderColor: activeFilterCount > 0 ? 'primary.main' : 'divider',
                color: activeFilterCount > 0 ? 'primary.main' : 'text.primary',
                whiteSpace: 'nowrap',
              }}
            >
              Filtros {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
            </Button>

            <Button
              type="submit"
              variant="contained"
              startIcon={<SearchRoundedIcon />}
              sx={{ minHeight: 52, px: 3.2, whiteSpace: 'nowrap' }}
            >
              Buscar
            </Button>
          </Box>

          {activeFilterCount > 0 && (
            <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mt: 1.8 }}>
              {location && (
                <Chip label={location} size="small" onDelete={() => removeFilter('location')} />
              )}
              {propertyType && (
                <Chip
                  label={propertyType}
                  size="small"
                  onDelete={() => removeFilter('propertyType')}
                />
              )}
              {bedrooms > 0 && (
                <Chip
                  label={`${bedrooms}+ quartos`}
                  size="small"
                  onDelete={() => removeFilter('bedrooms')}
                />
              )}
              {!isDefaultPriceRange(priceRange) && (
                <Chip
                  label={`${formatCurrency(priceRange[0])} — ${formatCurrency(priceRange[1])}`}
                  size="small"
                  onDelete={() => removeFilter('priceRange')}
                />
              )}
              <Button size="small" onClick={clearFilters} sx={{ minWidth: 0, px: 1 }}>
                Limpar tudo
              </Button>
            </Stack>
          )}
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 3.5 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          spacing={1.5}
          sx={{ mb: 2.4 }}
        >
          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 900 }}>
              {filteredProperties.length}{' '}
              {filteredProperties.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: 12.5 }}>
              Anúncios atualizados e verificados pela Ketris
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <FormControl
              size="small"
              sx={{ minWidth: { xs: 0, sm: 210 }, flex: { xs: 1, sm: 'none' } }}
            >
              <Select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortOption)}
                displayEmpty
                startAdornment={
                  <SortRoundedIcon sx={{ mr: 1, fontSize: 19, color: 'text.secondary' }} />
                }
                inputProps={{ 'aria-label': 'Ordenar imóveis' }}
                sx={{ bgcolor: '#FFFFFF' }}
              >
                <MenuItem value="recommended">Mais relevantes</MenuItem>
                <MenuItem value="price-asc">Menor preço</MenuItem>
                <MenuItem value="price-desc">Maior preço</MenuItem>
                <MenuItem value="area-desc">Maior área</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant={showMap ? 'contained' : 'outlined'}
              color={showMap ? 'secondary' : 'secondary'}
              startIcon={<MapOutlinedIcon />}
              onClick={() => setShowMap((current) => !current)}
              sx={{ display: { xs: 'none', lg: 'inline-flex' }, whiteSpace: 'nowrap' }}
            >
              {showMap ? 'Ocultar mapa' : 'Ver mapa'}
            </Button>

            <ToggleButtonGroup
              exclusive
              size="small"
              value={mobileView}
              onChange={(_, value: MobileView | null) => value && setMobileView(value)}
              sx={{ display: { xs: 'flex', lg: 'none' }, bgcolor: '#FFFFFF' }}
            >
              <ToggleButton value="list" aria-label="Ver lista">
                <GridViewRoundedIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="map" aria-label="Ver mapa">
                <MapOutlinedIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: showMap ? 'minmax(0, 1.45fr) minmax(390px, 0.85fr)' : '1fr',
            },
            gap: { xs: 2, lg: 2.5 },
            alignItems: 'start',
          }}
        >
          <Box sx={{ display: { xs: mobileView === 'list' ? 'block' : 'none', lg: 'block' } }}>
            {filteredProperties.length > 0 ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    xl: showMap ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
                  },
                  gap: 2.25,
                }}
              >
                {filteredProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    selected={property.id === selectedProperty?.id}
                    onSelect={selectProperty}
                  />
                ))}
              </Box>
            ) : (
              <Box
                sx={{
                  minHeight: 420,
                  display: 'grid',
                  placeItems: 'center',
                  textAlign: 'center',
                  bgcolor: '#FFFFFF',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 4,
                }}
              >
                <Box>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: 999,
                      bgcolor: 'rgba(243,2,116,0.08)',
                      color: 'primary.main',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <HomeWorkOutlinedIcon sx={{ fontSize: 30 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 900 }}>
                    Nenhum imóvel encontrado
                  </Typography>
                  <Typography color="text.secondary" sx={{ maxWidth: 390, mt: 0.7, mb: 2 }}>
                    Tente ampliar a faixa de preço ou remover alguns filtros para ver mais opções.
                  </Typography>
                  <Button variant="contained" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                </Box>
              </Box>
            )}
          </Box>

          <Box
            sx={{
              display: {
                xs: mobileView === 'map' ? 'block' : 'none',
                lg: showMap ? 'block' : 'none',
              },
              position: { lg: 'sticky' },
              top: { lg: 76 },
              height: { xs: '68vh', lg: 'calc(100vh - 100px)' },
              minHeight: { xs: 500, lg: 620 },
              overflow: 'hidden',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: '#E8E9EC',
              boxShadow: '0 16px 42px rgba(33,38,49,0.08)',
            }}
          >
            <PropertyMap
              properties={filteredProperties}
              selectedProperty={selectedProperty}
              onSelect={setSelectedProperty}
            />
          </Box>
        </Box>
      </Container>

      <SiteFooter />

      <Drawer anchor="right" open={filtersOpen} onClose={() => setFiltersOpen(false)}>
        {filterDrawer}
      </Drawer>
    </Box>
  )
}

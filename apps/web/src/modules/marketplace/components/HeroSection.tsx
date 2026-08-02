import { type Dispatch, type Ref, type SetStateAction } from 'react'
import { Box, Container, Typography } from '@mui/material'

import { alpha, gradients, surface } from '@shared/theme/tokens'

import type { SearchFilterKey, TextSearchFilterKey } from '../config/search-filters'
import { DesktopSearchBar } from './DesktopSearchBar'
import { HeroBrandVideo } from './HeroBrandVideo'
import { HeroStats } from './HeroStats'
import { MobileSearchBox } from './MobileSearchBox'

type HeroSectionProps = {
  selectedSearch: Record<SearchFilterKey, string>
  priceRange: [number, number]
  priceRangeLabel: string
  activeSearchMenu: SearchFilterKey | null
  searchDraft: Record<TextSearchFilterKey, string>
  searchHref: string
  desktopSearchRef: Ref<HTMLDivElement>
  mobileSearchRef: Ref<HTMLDivElement>
  openSearchMenu: (key: SearchFilterKey) => void
  closeSearchMenu: () => void
  selectSearchValue: (key: SearchFilterKey, value: string) => void
  updatePriceRange: (nextRange: [number, number]) => void
  filterSearchOptions: (key: TextSearchFilterKey) => readonly string[]
  setSearchDraft: Dispatch<SetStateAction<Record<TextSearchFilterKey, string>>>
}

export function HeroSection({
  selectedSearch,
  priceRange,
  priceRangeLabel,
  activeSearchMenu,
  searchDraft,
  searchHref,
  desktopSearchRef,
  mobileSearchRef,
  openSearchMenu,
  closeSearchMenu,
  selectSearchValue,
  updatePriceRange,
  filterSearchOptions,
  setSearchDraft,
}: HeroSectionProps) {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        zIndex: 5,
        color: surface.lightText,
        minHeight: { xs: 332, md: 315, xl: 455 },
        display: 'flex',
        alignItems: 'center',
        overflow: 'visible',
        width: '100%',
        backgroundColor: surface.darkDeep,
        backgroundImage: gradients.heroBackground(
          'https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=1800&q=80',
        ),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 3fr) minmax(0, 2fr)' },
            alignItems: 'center',
            gap: { xs: 2.4, lg: 4, xl: 7 },
            py: { xs: 2.5, md: 4.2, xl: 8 },
            isolation: 'isolate',
            textAlign: { xs: 'center', md: 'left' },
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Typography
              variant="h1"
              sx={{
                maxWidth: { xs: 420, md: 700, xl: 760 },
                color: surface.lightText,
                fontSize: { xs: '1.6rem', md: '2.45rem', xl: '3.35rem' },
                letterSpacing: 0,
                mb: { xs: 0.9, md: 1.7, xl: 2.5 },
                mx: { xs: 'auto', md: 0 },
              }}
            >
              <Box component="span" sx={{ display: 'block' }}>
                A infraestrutura digital
              </Box>
              <Box component="span" sx={{ display: 'block' }}>
                do mercado imobiliário
              </Box>
            </Typography>

            <Typography
              sx={{
                color: alpha.white[72],
                mb: { xs: 1.5, md: 3, xl: 4.8 },
                maxWidth: { xs: 360, md: 690, xl: 760 },
                fontSize: { xs: 13.6, md: 13.5, xl: 16 },
                mx: { xs: 'auto', md: 0 },
                whiteSpace: { md: 'nowrap' },
              }}
            >
              Aluguel e venda de imóveis com tecnologia de ponta, processos ágeis e total confiança.
            </Typography>

            <DesktopSearchBar
              selectedSearch={selectedSearch}
              priceRange={priceRange}
              priceRangeLabel={priceRangeLabel}
              activeSearchMenu={activeSearchMenu}
              searchDraft={searchDraft}
              searchHref={searchHref}
              desktopSearchRef={desktopSearchRef}
              openSearchMenu={openSearchMenu}
              closeSearchMenu={closeSearchMenu}
              selectSearchValue={selectSearchValue}
              updatePriceRange={updatePriceRange}
              filterSearchOptions={filterSearchOptions}
              setSearchDraft={setSearchDraft}
            />

            <MobileSearchBox
              activeSearchMenu={activeSearchMenu}
              mobileSearchRef={mobileSearchRef}
              searchDraft={searchDraft}
              searchHref={searchHref}
              selectedSearch={selectedSearch}
              openSearchMenu={openSearchMenu}
              selectSearchValue={selectSearchValue}
              filterSearchOptions={filterSearchOptions}
              setSearchDraft={setSearchDraft}
            />

            <HeroStats />
          </Box>

          <HeroBrandVideo />
        </Box>
      </Container>
    </Box>
  )
}

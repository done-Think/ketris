import { Box, Container, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { HeroSectionProps } from '../types/search'
import { DesktopSearchBar } from './DesktopSearchBar'
import { HeroBrandVideo } from './HeroBrandVideo'
import { HeroStats } from './HeroStats'
import { MobileSearchBox } from './MobileSearchBox'
import { styles } from '../styles/hero-section.styles'

export function HeroSection({
  selectedSearch,
  priceRange,
  priceRangeLabel,
  activeSearchMenu,
  searchDraft,
  searchHref,
  purpose,
  setPurpose,
  desktopSearchRef,
  mobileSearchRef,
  openSearchMenu,
  closeSearchMenu,
  selectSearchValue,
  updatePriceRange,
  filterSearchOptions,
  getSearchOptionLabel,
  setSearchDraft,
}: HeroSectionProps) {
  const t = useTranslations('marketplace.home.hero')

  return (
    <Box component="section" sx={styles.box}>
      <Container maxWidth="xl">
        <Box sx={styles.box2}>
          <Box sx={styles.box3}>
            <Typography variant="h1" sx={styles.typography}>
              <Box component="span" sx={styles.box4}>
                {t('titleLine1')}
              </Box>
              <Box component="span" sx={styles.box4}>
                {t('titleLine2')}
              </Box>
            </Typography>

            <Typography sx={styles.typography2}>{t('subtitle')}</Typography>

            <DesktopSearchBar
              selectedSearch={selectedSearch}
              priceRange={priceRange}
              priceRangeLabel={priceRangeLabel}
              activeSearchMenu={activeSearchMenu}
              searchDraft={searchDraft}
              searchHref={searchHref}
              purpose={purpose}
              setPurpose={setPurpose}
              desktopSearchRef={desktopSearchRef}
              openSearchMenu={openSearchMenu}
              closeSearchMenu={closeSearchMenu}
              selectSearchValue={selectSearchValue}
              updatePriceRange={updatePriceRange}
              filterSearchOptions={filterSearchOptions}
              getSearchOptionLabel={getSearchOptionLabel}
              setSearchDraft={setSearchDraft}
            />

            <MobileSearchBox
              activeSearchMenu={activeSearchMenu}
              mobileSearchRef={mobileSearchRef}
              searchDraft={searchDraft}
              searchHref={searchHref}
              purpose={purpose}
              setPurpose={setPurpose}
              selectedSearch={selectedSearch}
              priceRange={priceRange}
              priceRangeLabel={priceRangeLabel}
              openSearchMenu={openSearchMenu}
              closeSearchMenu={closeSearchMenu}
              selectSearchValue={selectSearchValue}
              updatePriceRange={updatePriceRange}
              filterSearchOptions={filterSearchOptions}
              getSearchOptionLabel={getSearchOptionLabel}
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

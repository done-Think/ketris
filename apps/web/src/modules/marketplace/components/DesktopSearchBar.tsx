'use client'

import { Box, Button, Stack } from '@mui/material'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

import { searchFilterOrder, textSearchFilterOrder } from '../config/search-filters'
import type { DesktopSearchBarProps, TextSearchFilterKey } from '../types/search'
import { PriceRangeMenu } from './PriceRangeMenu'
import { SearchDropdownFrame } from './SearchDropdownFrame'
import { SearchFilterTrigger } from './SearchFilterTrigger'
import { TextSearchMenu } from './TextSearchMenu'
import { styles, getBoxStyles } from '../styles/desktop-search-bar.styles'

export function DesktopSearchBar({
  selectedSearch,
  priceRange,
  priceRangeLabel,
  activeSearchMenu,
  searchDraft,
  searchHref,
  desktopSearchRef,
  openSearchMenu,
  closeSearchMenu,
  selectSearchValue,
  updatePriceRange,
  filterSearchOptions,
  getSearchOptionLabel,
  setSearchDraft,
}: DesktopSearchBarProps) {
  const t = useTranslations('marketplace.home.search')

  return (
    <Stack
      ref={desktopSearchRef}
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'stretch', md: 'center' }}
      sx={styles.stack}
    >
      {searchFilterOrder.map((key, index) => (
        <Box key={key} sx={getBoxStyles({ key, index })}>
          <SearchFilterTrigger
            filterKey={key}
            value={
              key === 'priceRange'
                ? priceRangeLabel
                : getSearchOptionLabel(key, selectedSearch[key])
            }
            onOpen={openSearchMenu}
          />

          {activeSearchMenu === key && (
            <SearchDropdownFrame filterKey={key}>
              {key === 'priceRange' ? (
                <PriceRangeMenu
                  priceRange={priceRange}
                  updatePriceRange={updatePriceRange}
                  closeSearchMenu={closeSearchMenu}
                />
              ) : textSearchFilterOrder.includes(key as TextSearchFilterKey) ? (
                <TextSearchMenu
                  filterKey={key as TextSearchFilterKey}
                  selectedSearch={selectedSearch}
                  searchDraft={searchDraft}
                  filterSearchOptions={filterSearchOptions}
                  getSearchOptionLabel={getSearchOptionLabel}
                  selectSearchValue={selectSearchValue}
                  setSearchDraft={setSearchDraft}
                />
              ) : null}
            </SearchDropdownFrame>
          )}
        </Box>
      ))}

      <Box component={Link} href={searchHref} sx={styles.box}>
        <Button component="span" variant="contained" sx={styles.button}>
          {t('submit')}
        </Button>
      </Box>
    </Stack>
  )
}

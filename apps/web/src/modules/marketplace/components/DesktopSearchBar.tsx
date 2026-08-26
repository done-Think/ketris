import { Box, Button, Stack } from '@mui/material'

import { Link } from '@/i18n/navigation'
import { componentText, radius, shadows, surface } from '@shared/theme/tokens'

import { searchFilterOrder, textSearchFilterOrder } from '../config/search-filters'
import type { DesktopSearchBarProps, TextSearchFilterKey } from '../types/search'
import { PriceRangeMenu } from './PriceRangeMenu'
import { SearchDropdownFrame } from './SearchDropdownFrame'
import { SearchFilterTrigger } from './SearchFilterTrigger'
import { TextSearchMenu } from './TextSearchMenu'

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
  setSearchDraft,
}: DesktopSearchBarProps) {
  return (
    <Stack
      ref={desktopSearchRef}
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'stretch', md: 'center' }}
      sx={{
        bgcolor: surface.paper,
        borderRadius: `${radius.sm}px`,
        p: { md: 0.8, xl: 1.3 },
        width: '100%',
        maxWidth: { md: 820, lg: '100%', xl: '100%' },
        boxSizing: 'border-box',
        boxShadow: shadows.heroSearch,
        display: { xs: 'none', md: 'flex' },
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {searchFilterOrder.map((key, index) => (
        <Box
          key={key}
          sx={{
            flex:
              key === 'location'
                ? { md: '1.35 1 0', xl: '1.35 1 0' }
                : key === 'priceRange'
                  ? { md: '1.45 1 0', xl: '1.45 1 0' }
                  : '1 1 0',
            minWidth: 0,
            position: 'relative',
            borderRight: index < 2 ? { xs: 0, md: '1px solid' } : 0,
            borderColor: 'divider',
          }}
        >
          <SearchFilterTrigger
            filterKey={key}
            value={key === 'priceRange' ? priceRangeLabel : selectedSearch[key]}
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
                  selectSearchValue={selectSearchValue}
                  setSearchDraft={setSearchDraft}
                />
              ) : null}
            </SearchDropdownFrame>
          )}
        </Box>
      ))}

      <Box
        component={Link}
        href={searchHref}
        sx={{
          flex: { md: '0 0 104px', xl: '0 0 118px' },
          minWidth: { md: 104, xl: 118 },
          ml: { md: 0.7, xl: 0.9 },
          textDecoration: 'none',
        }}
      >
        <Button
          component="span"
          variant="contained"
          sx={{
            width: '100%',
            minHeight: { md: 40, xl: 55 },
            px: 0,
            borderRadius: `${radius.sm}px`,
            ...componentText.desktopSearchButton,
          }}
        >
          Buscar
        </Button>
      </Box>
    </Stack>
  )
}

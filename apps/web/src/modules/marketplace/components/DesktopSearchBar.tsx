import { type Dispatch, type Ref, type SetStateAction } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import Link from 'next/link'

import { alpha, radius, shadows, surface } from '@shared/theme/tokens'

import {
  searchFilterOrder,
  searchOptions,
  textSearchFilterOrder,
  type SearchFilterKey,
  type TextSearchFilterKey,
} from '../config/search-filters'
import { PriceRangeMenu } from './PriceRangeMenu'
import { TextSearchMenu } from './TextSearchMenu'

type DesktopSearchBarProps = {
  selectedSearch: Record<SearchFilterKey, string>
  priceRange: [number, number]
  priceRangeLabel: string
  activeSearchMenu: SearchFilterKey | null
  searchDraft: Record<TextSearchFilterKey, string>
  searchHref: string
  desktopSearchRef: Ref<HTMLDivElement>
  openSearchMenu: (key: SearchFilterKey) => void
  closeSearchMenu: () => void
  selectSearchValue: (key: SearchFilterKey, value: string) => void
  updatePriceRange: (nextRange: [number, number]) => void
  filterSearchOptions: (key: TextSearchFilterKey) => readonly string[]
  setSearchDraft: Dispatch<SetStateAction<Record<TextSearchFilterKey, string>>>
}

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
          <Button
            fullWidth
            onClick={(event) => {
              event.stopPropagation()
              openSearchMenu(key)
            }}
            endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 18 }} />}
            sx={{
              justifyContent: 'space-between',
              alignItems: 'center',
              minWidth: 0,
              minHeight: { md: 40, xl: 55 },
              px: { xs: 1, md: 1.25, xl: 2 },
              py: { md: 0.35, xl: 0.6 },
              color: 'text.primary',
              borderRadius: `${radius.sm}px`,
              textAlign: 'left',
              textTransform: 'none',
              '& .MuiButton-endIcon': {
                color: 'text.disabled',
                ml: 1,
              },
              '&:hover': {
                bgcolor: alpha.magenta[6],
              },
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  color: 'text.disabled',
                  fontSize: { md: 8.5, xl: 10 },
                  fontWeight: 800,
                  lineHeight: 1.2,
                  textTransform: 'uppercase',
                }}
              >
                {searchOptions[key].label}
              </Typography>
              <Typography
                sx={{
                  color: 'text.primary',
                  fontSize: { md: 12, xl: 13.5 },
                  fontWeight: 900,
                  lineHeight: 1.35,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {key === 'priceRange' ? priceRangeLabel : selectedSearch[key]}
              </Typography>
            </Box>
          </Button>

          {activeSearchMenu === key && (
            <Box
              onClick={(event) => event.stopPropagation()}
              sx={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: key === 'priceRange' ? 'auto' : 0,
                right: key === 'priceRange' ? 0 : 'auto',
                width: '100%',
                maxWidth: 'calc(100vw - 32px)',
                zIndex: 50,
                display: { xs: 'none', md: 'block' },
                borderRadius: `${radius.sm}px`,
                bgcolor: surface.paper,
                color: 'text.primary',
                boxShadow: shadows.popover,
                overflow: key === 'priceRange' ? 'visible' : 'hidden',
              }}
            >
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
            </Box>
          )}
        </Box>
      ))}

      <Button
        component={Link}
        href={searchHref}
        variant="contained"
        sx={{
          flex: { md: '0 0 104px', xl: '0 0 118px' },
          minWidth: { md: 104, xl: 118 },
          minHeight: { md: 40, xl: 55 },
          ml: { md: 0.7, xl: 0.9 },
          px: 0,
          borderRadius: `${radius.sm}px`,
          fontSize: { md: 12, xl: 14 },
        }}
      >
        Buscar
      </Button>
    </Stack>
  )
}

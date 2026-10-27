'use client'

import { useState } from 'react'
import { Box, Button, Drawer, IconButton, Stack, Typography } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

import { searchFilterOrder, textSearchFilterOrder } from '../config/search-filters'
import type { MobileSearchBoxProps, TextSearchFilterKey } from '../types/search'
import { PriceRangeMenu } from './PriceRangeMenu'
import { SearchFilterTrigger } from './SearchFilterTrigger'
import { TextSearchMenu } from './TextSearchMenu'
import { styles } from '../styles/mobile-search-box.styles'

export function MobileSearchBox({
  selectedSearch,
  priceRange,
  priceRangeLabel,
  activeSearchMenu,
  searchDraft,
  searchHref,
  mobileSearchRef,
  openSearchMenu,
  closeSearchMenu,
  selectSearchValue,
  updatePriceRange,
  filterSearchOptions,
  getSearchOptionLabel,
  setSearchDraft,
}: MobileSearchBoxProps) {
  const t = useTranslations('marketplace.home.search')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const closeDrawer = () => {
    closeSearchMenu()
    setIsDrawerOpen(false)
  }

  return (
    <Box sx={styles.box}>
      <Button
        fullWidth
        aria-haspopup="dialog"
        onClick={() => setIsDrawerOpen(true)}
        startIcon={<SearchOutlinedIcon sx={styles.searchOutlinedIcon} />}
        sx={styles.button}
      >
        <Typography sx={styles.typography}>{t('mobilePlaceholder')}</Typography>
      </Button>

      <Box component={Link} href={searchHref} sx={styles.box2}>
        <Button component="span" variant="contained" fullWidth sx={styles.button2}>
          {t('submit')}
        </Button>
      </Box>

      <Drawer
        anchor="bottom"
        open={isDrawerOpen}
        onClose={closeDrawer}
        slotProps={{
          paper: {
            role: 'dialog',
            'aria-modal': true,
            'aria-labelledby': 'mobile-search-drawer-title',
            sx: styles.paper,
          },
        }}
      >
        {/* O conteúdo da gaveta usa o mobileSearchRef para que o click-away da home não feche
            os menus ao clicar aqui dentro (o Drawer é renderizado em portal). */}
        <Stack ref={mobileSearchRef} sx={styles.stack}>
          <Box aria-hidden sx={styles.box3} />
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={styles.stack2}
          >
            <Typography id="mobile-search-drawer-title" component="h2" sx={styles.typography2}>
              {t('mobileSearchTitle')}
            </Typography>
            <IconButton aria-label={t('closeSearch')} onClick={closeDrawer}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          <Stack spacing={1.25} sx={styles.stack3}>
            {searchFilterOrder.map((key) => (
              <Box key={key} sx={styles.box4}>
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
                  <Box sx={styles.box5}>
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
                  </Box>
                )}
              </Box>
            ))}
          </Stack>

          <Box sx={styles.box6}>
            <Box component={Link} href={searchHref} onClick={closeDrawer} sx={styles.box7}>
              <Button component="span" variant="contained" fullWidth sx={styles.button3}>
                {t('submit')}
              </Button>
            </Box>
          </Box>
        </Stack>
      </Drawer>
    </Box>
  )
}

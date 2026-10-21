'use client'

import { useState } from 'react'
import { Box, Button, Drawer, IconButton, Stack, Typography } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { componentText, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import { searchFilterOrder, textSearchFilterOrder } from '../config/search-filters'
import type { MobileSearchBoxProps, TextSearchFilterKey } from '../types/search'
import { PriceRangeMenu } from './PriceRangeMenu'
import { SearchFilterTrigger } from './SearchFilterTrigger'
import { TextSearchMenu } from './TextSearchMenu'

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
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const closeDialog = () => {
    closeSearchMenu()
    setIsDialogOpen(false)
  }

  return (
    <Box
      sx={{
        display: { xs: 'block', md: 'none' },
        bgcolor: surface.paper,
        borderRadius: `${radius.sm}px`,
        p: 1,
        maxWidth: 360,
        mx: 'auto',
        boxShadow: shadows.mobileSearch,
      }}
    >
      <Button
        fullWidth
        aria-haspopup="dialog"
        onClick={() => setIsDialogOpen(true)}
        startIcon={<SearchOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
        sx={{
          justifyContent: 'flex-start',
          minHeight: 36,
          px: 1.4,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: `${radius.sm}px`,
          color: 'text.secondary',
          bgcolor: surface.paper,
          textAlign: 'left',
          ...componentText.resetButtonText,
          '&:hover': { bgcolor: surface.app },
          '& .MuiButton-startIcon': {
            color: 'primary.main',
          },
        }}
      >
        <Typography
          sx={{
            color: 'text.secondary',
            ...componentText.mobileSearchText,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {t('mobilePlaceholder')}
        </Typography>
      </Button>

      <Box
        component={Link}
        href={searchHref}
        sx={{
          display: 'block',
          mt: 0.9,
          textDecoration: 'none',
        }}
      >
        <Button
          component="span"
          variant="contained"
          fullWidth
          sx={{
            minHeight: 36,
            borderRadius: `${radius.sm}px`,
            ...componentText.mobileSearchSubmit,
          }}
        >
          {t('submit')}
        </Button>
      </Box>

      <Drawer
        anchor="bottom"
        open={isDialogOpen}
        onClose={closeDialog}
        slotProps={{
          paper: {
            role: 'dialog',
            'aria-modal': true,
            'aria-labelledby': 'mobile-search-dialog-title',
            sx: {
              maxHeight: '85vh',
              bgcolor: surface.paper,
              borderTopLeftRadius: `${radius.lg}px`,
              borderTopRightRadius: `${radius.lg}px`,
              overflow: 'hidden',
            },
          },
        }}
      >
        {/* O conteúdo da gaveta usa o mobileSearchRef para que o click-away da home não feche
            os menus ao clicar aqui dentro (o Drawer é renderizado em portal). */}
        <Stack ref={mobileSearchRef} sx={{ maxHeight: '85vh', minHeight: 0 }}>
          <Box
            aria-hidden
            sx={{
              alignSelf: 'center',
              width: 40,
              height: 4,
              mt: 1,
              borderRadius: `${radius.full}px`,
              bgcolor: 'divider',
            }}
          />
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              px: 2,
              pt: 0.5,
              pb: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              id="mobile-search-dialog-title"
              component="h2"
              sx={{ color: 'text.primary', ...componentText.menuTitle }}
            >
              {t('mobileDialogTitle')}
            </Typography>
            <IconButton aria-label={t('closeSearch')} onClick={closeDialog}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          <Stack spacing={1.25} sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 2 }}>
            {searchFilterOrder.map((key) => (
              <Box
                key={key}
                sx={{
                  bgcolor: surface.paper,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: `${radius.sm}px`,
                  overflow: 'hidden',
                }}
              >
                <SearchFilterTrigger
                  filterKey={key}
                  value={
                    key === 'priceRange'
                      ? priceRangeLabel
                      : key === 'propertyType'
                        ? getSearchOptionLabel(key, selectedSearch[key])
                        : selectedSearch[key]
                  }
                  onOpen={openSearchMenu}
                />

                {activeSearchMenu === key && (
                  <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
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

          <Box
            sx={{
              p: 2,
              pb: 'calc(16px + env(safe-area-inset-bottom))',
              bgcolor: surface.paper,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box
              component={Link}
              href={searchHref}
              onClick={closeDialog}
              sx={{ display: 'block', textDecoration: 'none' }}
            >
              <Button
                component="span"
                variant="contained"
                fullWidth
                sx={{
                  minHeight: 44,
                  borderRadius: `${radius.sm}px`,
                  ...componentText.mobileSearchSubmit,
                }}
              >
                {t('submit')}
              </Button>
            </Box>
          </Box>
        </Stack>
      </Drawer>
    </Box>
  )
}

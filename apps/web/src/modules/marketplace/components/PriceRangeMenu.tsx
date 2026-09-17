import { Box, Button, IconButton, Slider, Stack, TextField, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useTranslations } from 'next-intl'

import { componentText, radius } from '@shared/theme/tokens'

import { priceLimit } from '../config/search-filters'
import type { PriceRangeMenuProps } from '../types/search'
import { formatSearchCurrency } from '../utils/search'

export function PriceRangeMenu({
  priceRange,
  updatePriceRange,
  closeSearchMenu,
}: PriceRangeMenuProps) {
  const t = useTranslations('marketplace.home.search')

  return (
    <Box sx={{ px: 1.3, py: 1.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography sx={{ color: 'text.primary', ...componentText.menuTitle }}>
          {t('priceRange')}
        </Typography>
        <IconButton aria-label={t('closePriceRange')} size="small" onClick={closeSearchMenu}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Stack direction="row" spacing={0.8} sx={{ mb: 2 }}>
        <TextField
          label={t('minPrice')}
          type="number"
          value={priceRange[0]}
          onChange={(event) =>
            updatePriceRange([Number(event.target.value || priceLimit.min), priceRange[1]])
          }
          size="small"
          fullWidth
          sx={{ '& .MuiInputBase-input': { px: 1.2 } }}
          slotProps={{
            htmlInput: {
              min: priceLimit.min,
              max: priceLimit.max,
              step: priceLimit.step,
            },
          }}
        />
        <TextField
          label={t('maxPrice')}
          type="number"
          value={priceRange[1]}
          onChange={(event) =>
            updatePriceRange([priceRange[0], Number(event.target.value || priceLimit.min)])
          }
          size="small"
          fullWidth
          sx={{ '& .MuiInputBase-input': { px: 1.2 } }}
          slotProps={{
            htmlInput: {
              min: priceLimit.min,
              max: priceLimit.max,
              step: priceLimit.step,
            },
          }}
        />
      </Stack>

      <Box sx={{ px: 1 }}>
        <Slider
          getAriaLabel={() => t('priceRange')}
          value={priceRange}
          onChange={(_, nextValue) => updatePriceRange(nextValue as [number, number])}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => formatSearchCurrency(value)}
          min={priceLimit.min}
          max={priceLimit.max}
          step={priceLimit.step}
          disableSwap
        />
      </Box>

      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
        <Typography sx={{ color: 'text.secondary', ...componentText.menuCaption }}>
          {formatSearchCurrency(priceLimit.min)}
        </Typography>
        <Typography sx={{ color: 'text.secondary', ...componentText.menuCaption }}>
          {formatSearchCurrency(priceLimit.max)}
        </Typography>
      </Stack>

      <Button
        variant="contained"
        fullWidth
        onClick={closeSearchMenu}
        sx={{ mt: 1.8, minHeight: 38, borderRadius: `${radius.sm}px` }}
      >
        {t('apply')}
      </Button>
    </Box>
  )
}

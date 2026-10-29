import { Box, Button, IconButton, Slider, Stack, TextField, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useLocale, useTranslations } from 'next-intl'
import type { AppLocale } from '@/i18n/types/locale.types'

import { priceLimit } from '../config/search-filters'
import type { PriceRangeMenuProps } from '../types/search'
import { formatSearchCurrency } from '../utils/search'
import { styles } from '../styles/price-range-menu.styles'

export function PriceRangeMenu({
  priceRange,
  updatePriceRange,
  closeSearchMenu,
}: PriceRangeMenuProps) {
  const locale = useLocale() as AppLocale
  const t = useTranslations('marketplace.home.search')

  return (
    <Box sx={styles.box}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={styles.stack}>
        <Typography sx={styles.typography}>{t('priceRange')}</Typography>
        <IconButton aria-label={t('closePriceRange')} size="small" onClick={closeSearchMenu}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Stack direction="row" spacing={0.8} sx={styles.stack2}>
        <TextField
          label={t('minPrice')}
          type="number"
          value={priceRange[0]}
          onChange={(event) =>
            updatePriceRange([Number(event.target.value || priceLimit.min), priceRange[1]])
          }
          size="small"
          fullWidth
          sx={styles.textField}
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
          sx={styles.textField}
          slotProps={{
            htmlInput: {
              min: priceLimit.min,
              max: priceLimit.max,
              step: priceLimit.step,
            },
          }}
        />
      </Stack>

      <Box sx={styles.box2}>
        <Slider
          getAriaLabel={() => t('priceRange')}
          value={priceRange}
          onChange={(_, nextValue) => updatePriceRange(nextValue as [number, number])}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => formatSearchCurrency(value, locale)}
          min={priceLimit.min}
          max={priceLimit.max}
          step={priceLimit.step}
          disableSwap
        />
      </Box>

      <Stack direction="row" justifyContent="space-between" sx={styles.stack3}>
        <Typography sx={styles.typography2}>
          {formatSearchCurrency(priceLimit.min, locale)}
        </Typography>
        <Typography sx={styles.typography2}>
          {formatSearchCurrency(priceLimit.max, locale)}
        </Typography>
      </Stack>

      <Button variant="contained" fullWidth onClick={closeSearchMenu} sx={styles.button}>
        {t('apply')}
      </Button>
    </Box>
  )
}

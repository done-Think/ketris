import { useState } from 'react'
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useLocale, useTranslations } from 'next-intl'

import { MoneyInput } from '@shared/components/form/MoneyInput'
import { formatCurrencySymbol } from '@shared/lib/utils/format'
import type { PriceRange, PriceRangeMenuProps } from '../types/search'
import { isValidPriceRange, toPriceLimit } from '../utils/search'
import { styles } from '../styles/price-range-menu.styles'

export function PriceRangeMenu({
  priceRange,
  updatePriceRange,
  closeSearchMenu,
}: PriceRangeMenuProps) {
  const t = useTranslations('marketplace.home.search')
  const locale = useLocale()
  const [draft, setDraft] = useState<PriceRange>(priceRange)
  const valid = isValidPriceRange(draft)
  const moneySlotProps = {
    input: {
      inputComponent: MoneyInput as never,
      startAdornment: (
        <InputAdornment position="start">{formatCurrencySymbol(locale)}</InputAdornment>
      ),
    },
  }

  return (
    <Box
      component="form"
      sx={styles.box}
      onSubmit={(event) => {
        event.preventDefault()
        if (!valid) return
        updatePriceRange(draft)
        closeSearchMenu()
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={styles.stack}>
        <Typography sx={styles.typography}>{t('priceRange')}</Typography>
        <IconButton aria-label={t('closePriceRange')} size="small" onClick={closeSearchMenu}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Stack direction="row" spacing={0.8} sx={styles.stack2}>
        <TextField
          label={t('minPrice')}
          name="minPrice"
          value={draft[0] ?? ''}
          placeholder={t('noMinPrice')}
          error={!valid}
          onChange={(event) => setDraft([toPriceLimit(event.target.value), draft[1]])}
          size="small"
          fullWidth
          sx={styles.textField}
          slotProps={moneySlotProps}
        />
        <TextField
          label={t('maxPrice')}
          name="maxPrice"
          value={draft[1] ?? ''}
          placeholder={t('noMaxPrice')}
          error={!valid}
          helperText={!valid ? t('errors.priceInvalid') : undefined}
          onChange={(event) => setDraft([draft[0], toPriceLimit(event.target.value)])}
          size="small"
          fullWidth
          sx={styles.textField}
          slotProps={moneySlotProps}
        />
      </Stack>

      <Button type="submit" variant="contained" fullWidth disabled={!valid} sx={styles.button}>
        {t('apply')}
      </Button>
    </Box>
  )
}

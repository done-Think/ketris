import { useState } from 'react'
import { Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useTranslations } from 'next-intl'

import type { PriceRange, PriceRangeMenuProps } from '../types/search'
import { isValidPriceRange } from '../utils/search'
import { styles } from '../styles/price-range-menu.styles'

export function PriceRangeMenu({
  priceRange,
  updatePriceRange,
  closeSearchMenu,
}: PriceRangeMenuProps) {
  const t = useTranslations('marketplace.home.search')
  const [draft, setDraft] = useState<PriceRange>(priceRange)
  const valid = isValidPriceRange(draft)

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
          type="number"
          value={draft[0] ?? ''}
          placeholder={t('noMinPrice')}
          error={!valid}
          onChange={(event) =>
            setDraft([event.target.value === '' ? null : Number(event.target.value), draft[1]])
          }
          size="small"
          fullWidth
          sx={styles.textField}
          slotProps={{
            htmlInput: {
              min: 0,
              step: 'any',
            },
          }}
        />
        <TextField
          label={t('maxPrice')}
          type="number"
          value={draft[1] ?? ''}
          placeholder={t('noMaxPrice')}
          error={!valid}
          helperText={
            !valid ? t('errors.priceInvalid') : draft[1] === null ? t('noMaxPrice') : undefined
          }
          onChange={(event) =>
            setDraft([draft[0], event.target.value === '' ? null : Number(event.target.value)])
          }
          size="small"
          fullWidth
          sx={styles.textField}
          slotProps={{
            htmlInput: {
              min: 0,
              step: 'any',
            },
          }}
        />
      </Stack>

      <Button type="submit" variant="contained" fullWidth disabled={!valid} sx={styles.button}>
        {t('apply')}
      </Button>
    </Box>
  )
}

import { Box, Button, IconButton, Slider, Stack, TextField, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

import { radius } from '@shared/theme/tokens'

import { priceLimit } from '../config/search-filters'
import { formatSearchCurrency } from '../utils/search'

type PriceRangeMenuProps = {
  priceRange: [number, number]
  updatePriceRange: (nextRange: [number, number]) => void
  closeSearchMenu: () => void
}

export function PriceRangeMenu({
  priceRange,
  updatePriceRange,
  closeSearchMenu,
}: PriceRangeMenuProps) {
  return (
    <Box sx={{ px: 1.3, py: 1.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography sx={{ color: 'text.primary', fontSize: 14, fontWeight: 900 }}>
          Faixa de preço
        </Typography>
        <IconButton aria-label="Fechar faixa de preço" size="small" onClick={closeSearchMenu}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Stack direction="row" spacing={0.8} sx={{ mb: 2 }}>
        <TextField
          label="Mínimo"
          type="number"
          value={priceRange[0]}
          onChange={(event) =>
            updatePriceRange([Number(event.target.value || priceLimit.min), priceRange[1]])
          }
          size="small"
          fullWidth
          sx={{ '& .MuiInputBase-input': { px: 1.2 } }}
          inputProps={{
            min: priceLimit.min,
            max: priceLimit.max,
            step: priceLimit.step,
          }}
        />
        <TextField
          label="Máximo"
          type="number"
          value={priceRange[1]}
          onChange={(event) =>
            updatePriceRange([priceRange[0], Number(event.target.value || priceLimit.min)])
          }
          size="small"
          fullWidth
          sx={{ '& .MuiInputBase-input': { px: 1.2 } }}
          inputProps={{
            min: priceLimit.min,
            max: priceLimit.max,
            step: priceLimit.step,
          }}
        />
      </Stack>

      <Box sx={{ px: 1 }}>
        <Slider
          getAriaLabel={() => 'Faixa de preço'}
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
        <Typography sx={{ color: 'text.secondary', fontSize: 11 }}>
          {formatSearchCurrency(priceLimit.min)}
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: 11 }}>
          {formatSearchCurrency(priceLimit.max)}
        </Typography>
      </Stack>

      <Button
        variant="contained"
        fullWidth
        onClick={closeSearchMenu}
        sx={{ mt: 1.8, minHeight: 38, borderRadius: `${radius.sm}px` }}
      >
        Aplicar
      </Button>
    </Box>
  )
}

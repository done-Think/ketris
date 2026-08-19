import AddRoundedIcon from '@mui/icons-material/AddRounded'
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Box,
  Button,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'

import { brand, radius, surface } from '@shared/theme/tokens'

import { salesPipelineStages } from '../../config/sales-pipeline-stages'
import type { SalesPipelineToolbarProps } from '../../types/sales-pipeline'

export function SalesPipelineToolbar({
  search,
  selectedStage,
  selectedStageId,
  filterAnchor,
  onSearchChange,
  onFilterOpen,
  onFilterClose,
  onStageSelect,
}: SalesPipelineToolbarProps) {
  return (
    <Stack
      direction={{ xs: 'column', lg: 'row' }}
      alignItems={{ xs: 'stretch', lg: 'center' }}
      justifyContent="space-between"
      gap={1.5}
      sx={{
        flexWrap: { lg: 'nowrap' },
        mr: { lg: -1.75 },
        pb: 1.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ flexShrink: 0 }}>
        <Typography
          component="h1"
          sx={{
            fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
            fontSize: { xs: 26, sm: 30, xl: 32 },
            fontWeight: 700,
            lineHeight: { xs: 1.2, sm: 1.15 },
            letterSpacing: '-0.02em',
          }}
        >
          Pipeline de Vendas
        </Typography>
      </Box>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        gap={1.25}
        sx={{ minWidth: 0, alignItems: { sm: 'center' }, flexWrap: { sm: 'wrap', lg: 'nowrap' } }}
      >
        <TextField
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar oportunidade..."
          size="small"
          inputProps={{ 'aria-label': 'Buscar oportunidade' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ color: 'text.disabled', fontSize: 16 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            width: { xs: '100%', sm: 210, xl: 224 },
            '& .MuiOutlinedInput-root': {
              height: { xs: 40, sm: 32 },
              borderRadius: `${radius.sm}px`,
              bgcolor: 'background.paper',
              fontSize: 12,
              '& fieldset': { borderColor: brand.neutral[100] },
              '&:hover fieldset': { borderColor: brand.neutral[200] },
            },
            '& .MuiInputBase-input::placeholder': {
              color: brand.neutral[400],
              opacity: 1,
            },
          }}
        />
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<FilterAltOutlinedIcon />}
          endIcon={<KeyboardArrowDownRoundedIcon />}
          onClick={(event) => onFilterOpen(event.currentTarget)}
          aria-haspopup="menu"
          aria-expanded={Boolean(filterAnchor)}
          sx={{
            width: { sm: 160 },
            minWidth: { sm: 160 },
            flexShrink: 0,
            height: { xs: 40, sm: 32 },
            px: 1.25,
            justifyContent: 'space-between',
            borderColor: brand.neutral[100],
            borderRadius: `${radius.sm}px`,
            bgcolor: 'background.paper',
            color: 'text.secondary',
            fontSize: 12,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            '&:hover': { borderColor: brand.neutral[200], bgcolor: 'background.paper' },
            '& .MuiButton-startIcon': { ml: 0, mr: 0.75 },
            '& .MuiButton-endIcon': { ml: 0.75, mr: 0 },
            '& .MuiSvgIcon-root': { fontSize: 16 },
          }}
        >
          {selectedStage?.label ?? 'Filtrar por Etapa'}
        </Button>
        <Menu anchorEl={filterAnchor} open={Boolean(filterAnchor)} onClose={onFilterClose}>
          <MenuItem selected={!selectedStageId} onClick={() => onStageSelect(null)}>
            Todas as etapas
          </MenuItem>
          {salesPipelineStages.map((stage) => (
            <MenuItem
              key={stage.id}
              selected={selectedStageId === stage.id}
              onClick={() => onStageSelect(stage.id)}
            >
              <Box
                aria-hidden="true"
                sx={{
                  width: 8,
                  height: 8,
                  mr: 1.2,
                  borderRadius: `${radius.full}px`,
                  bgcolor: stage.color,
                }}
              />
              {stage.label}
            </MenuItem>
          ))}
        </Menu>
        <Tooltip title="Fluxo de criação em preparação">
          <Box
            component="span"
            tabIndex={0}
            aria-label="Nova Oportunidade: fluxo de criação em preparação"
            sx={{ display: 'inline-flex', width: { sm: 166 }, minWidth: { sm: 166 } }}
          >
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              disabled
              sx={{
                width: '100%',
                height: { xs: 40, sm: 32 },
                px: 1.5,
                borderRadius: `${radius.sm}px`,
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                '& .MuiButton-startIcon': { ml: 0, mr: 0.75 },
                '& .MuiSvgIcon-root': { fontSize: 16 },
                '&.Mui-disabled': {
                  bgcolor: brand.magenta[500],
                  color: surface.lightText,
                  opacity: 1,
                },
              }}
            >
              Nova Oportunidade
            </Button>
          </Box>
        </Tooltip>
      </Stack>
    </Stack>
  )
}

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded'
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined'
import {
  Box,
  Button,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material'
import { useTranslations } from 'next-intl'

import { DashboardNotificationsButton, DashboardPageHeader } from '@shared/components/layout'
import { brand, radius, shadows } from '@shared/theme/tokens'

import { salesPipelineStages } from '../../config/sales-pipeline-stages'
import type { SalesPipelineToolbarProps, SalesPipelineViewMode } from '../../types/sales-pipeline'

export function SalesPipelineToolbar({
  search,
  selectedStage,
  selectedStageId,
  filterAnchor,
  viewMode,
  onSearchChange,
  onFilterOpen,
  onFilterClose,
  onStageSelect,
  onNewOpportunity,
  onViewModeChange,
}: SalesPipelineToolbarProps) {
  const t = useTranslations('crm.pipeline')

  const actions = (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      gap={1.2}
      sx={{ width: { xs: '100%', lg: 'auto' }, minWidth: 0, alignItems: { sm: 'center' } }}
    >
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={(_event, nextViewMode: SalesPipelineViewMode | null) => {
          if (nextViewMode) onViewModeChange(nextViewMode)
        }}
        sx={{
          flexShrink: 0,
          height: 36,
          '& .MuiToggleButton-root': {
            px: 1.1,
            borderColor: brand.neutral[100],
            color: 'text.secondary',
            '&.Mui-selected': {
              bgcolor: brand.neutral[50],
              color: 'text.primary',
            },
          },
        }}
      >
        <Tooltip title={t('viewMode.kanban')}>
          <ToggleButton value="kanban" aria-label={t('viewMode.kanban')}>
            <ViewKanbanOutlinedIcon sx={{ fontSize: 16 }} />
          </ToggleButton>
        </Tooltip>
        <Tooltip title={t('viewMode.list')}>
          <ToggleButton value="list" aria-label={t('viewMode.list')}>
            <TableRowsRoundedIcon sx={{ fontSize: 16 }} />
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>

      <TextField
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={t('searchPlaceholder')}
        size="small"
        slotProps={{
          htmlInput: { 'aria-label': t('searchAriaLabel') },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ color: 'text.disabled', fontSize: 16 }} />
              </InputAdornment>
            ),
          },
        }}
        sx={{
          width: { xs: '100%', sm: 224 },
          '& .MuiOutlinedInput-root': {
            height: 36,
            borderRadius: `${radius.sm}px`,
            bgcolor: 'background.paper',
            fontSize: 14,
            '& fieldset': { borderColor: brand.neutral[100] },
            '&:hover fieldset': { borderColor: brand.neutral[200] },
          },
          '& .MuiInputBase-input::placeholder': {
            color: brand.neutral[400],
            opacity: 1,
          },
        }}
      />

      {viewMode === 'kanban' ? (
        <>
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
              height: 36,
              px: 1.5,
              justifyContent: 'space-between',
              borderColor: brand.neutral[100],
              borderRadius: `${radius.full}px`,
              bgcolor: 'background.paper',
              color: 'text.secondary',
              fontSize: 14,
              fontWeight: 800,
              whiteSpace: 'nowrap',
              '&:hover': { borderColor: brand.neutral[200], bgcolor: 'background.paper' },
              '& .MuiButton-startIcon': { ml: 0, mr: 0.75 },
              '& .MuiButton-endIcon': { ml: 0.75, mr: 0 },
              '& .MuiSvgIcon-root': { fontSize: 16 },
            }}
          >
            {selectedStage ? t(`stages.${selectedStage.labelKey}`) : t('filterByStage')}
          </Button>
          <Menu anchorEl={filterAnchor} open={Boolean(filterAnchor)} onClose={onFilterClose}>
            <MenuItem selected={!selectedStageId} onClick={() => onStageSelect(null)}>
              {t('allStages')}
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
                {t(`stages.${stage.labelKey}`)}
              </MenuItem>
            ))}
          </Menu>
        </>
      ) : null}

      <Button
        variant="contained"
        startIcon={<AddRoundedIcon />}
        onClick={onNewOpportunity}
        sx={{
          width: { sm: 166 },
          minWidth: { sm: 166 },
          height: 36,
          px: 2,
          borderRadius: `${radius.sm}px`,
          boxShadow: shadows.none,
          fontSize: 14,
          fontWeight: 800,
          whiteSpace: 'nowrap',
          '& .MuiButton-startIcon': { ml: 0, mr: 0.75 },
          '& .MuiSvgIcon-root': { fontSize: 16 },
        }}
      >
        {t('newOpportunity')}
      </Button>

      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <DashboardNotificationsButton />
      </Box>
    </Stack>
  )

  return <DashboardPageHeader title={t('title')} subtitle={t('subtitle')} actions={actions} />
}

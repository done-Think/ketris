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
import * as crmStyles from '../../styles/sales-pipeline-toolbar.styles'

import {
  DashboardHeaderActionButton,
  DashboardNotificationsButton,
  DashboardPageHeader,
} from '@shared/components/layout'

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
    <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.2} sx={crmStyles.stackSx}>
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={(_event, nextViewMode: SalesPipelineViewMode | null) => {
          if (nextViewMode) onViewModeChange(nextViewMode)
        }}
        sx={crmStyles.toggleButtonGroupSx}
      >
        <Tooltip title={t('viewMode.kanban')}>
          <ToggleButton value="kanban" aria-label={t('viewMode.kanban')}>
            <ViewKanbanOutlinedIcon sx={crmStyles.viewKanbanOutlinedIconSx} />
          </ToggleButton>
        </Tooltip>
        <Tooltip title={t('viewMode.list')}>
          <ToggleButton value="list" aria-label={t('viewMode.list')}>
            <TableRowsRoundedIcon sx={crmStyles.viewKanbanOutlinedIconSx} />
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
                <SearchRoundedIcon sx={crmStyles.searchRoundedIconSx} />
              </InputAdornment>
            ),
          },
        }}
        sx={crmStyles.textFieldSx}
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
            sx={crmStyles.buttonSx}
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
                <Box aria-hidden="true" sx={crmStyles.getBoxSx(stage)} />
                {t(`stages.${stage.labelKey}`)}
              </MenuItem>
            ))}
          </Menu>
        </>
      ) : null}

      <DashboardHeaderActionButton startIcon={<AddRoundedIcon />} onClick={onNewOpportunity}>
        {t('newOpportunity')}
      </DashboardHeaderActionButton>

      <Box sx={crmStyles.boxSx}>
        <DashboardNotificationsButton />
      </Box>
    </Stack>
  )

  return <DashboardPageHeader title={t('title')} subtitle={t('subtitle')} actions={actions} />
}

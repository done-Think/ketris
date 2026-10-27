import { Box } from '@mui/material'
import * as maintenanceStyles from '../styles/maintenance-filter-option-label.styles'

import type { MaintenanceFilterOptionLabelProps } from '../types/maintenance'

export function MaintenanceFilterOptionLabel({
  active,
  count,
  label,
}: MaintenanceFilterOptionLabelProps) {
  return (
    <Box component="span" sx={maintenanceStyles.boxSx}>
      <Box component="span">{label}</Box>
      <Box component="span" sx={maintenanceStyles.getBoxSx(active)}>
        {count}
      </Box>
    </Box>
  )
}

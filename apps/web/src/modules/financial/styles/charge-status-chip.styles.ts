import type { SxProps, Theme } from '@mui/material'
import { radius } from '@shared/theme/tokens'

import { chargeStatusStyles } from '../config/charge-status'
import type { ChargeStatus } from '../types/charge'

export function getChargeStatusChipStyles(status: ChargeStatus): SxProps<Theme> {
  return {
    height: 30,
    ...chargeStatusStyles[status],
    borderRadius: `${radius.full}px`,
    fontWeight: 900,
    fontSize: 13,
  }
}

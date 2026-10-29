import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { useFinancialFormat } from '../hooks/use-financial-format'
import { getChargeRowStyles, styles } from '../styles/charge-row.styles'
import type { ChargeRowProps } from '../types/charge'
import { isLockedCharge } from '../utils/charge-adapter'
import { ChargeStatusChip } from './ChargeStatusChip'

export function ChargeRow({
  charge,
  zebra,
  readOnly,
  onView,
  onEdit,
  onCancel,
  onDelete,
}: ChargeRowProps) {
  const t = useTranslations('charges')
  const format = useFinancialFormat()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const locked = isLockedCharge(charge)
  const choose = (action: () => void) => () => {
    setAnchor(null)
    action()
  }

  return (
    <TableRow sx={getChargeRowStyles(zebra)}>
      <TableCell>
        <Button
          aria-label={`${t('actions.view')} ${charge.code}`}
          onClick={onView}
          variant="text"
          sx={styles.code}
        >
          {charge.code}
        </Button>
      </TableCell>
      <TableCell>{charge.payer}</TableCell>
      <TableCell>
        <Typography noWrap sx={styles.property}>
          {charge.property}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography sx={styles.amount}>{format.currency(charge.amount)}</Typography>
      </TableCell>
      <TableCell>
        <Typography sx={styles.dueDate}>{format.date(charge.dueDate)}</Typography>
      </TableCell>
      <TableCell>
        <ChargeStatusChip status={charge.status} />
      </TableCell>
      <TableCell>
        <Stack direction="row" justifyContent="center" alignItems="center">
          <Tooltip title={t('actions.view')}>
            <IconButton
              aria-label={`${t('actions.view')} ${charge.code}`}
              onClick={onView}
              size="small"
              sx={styles.iconButton}
            >
              <VisibilityOutlinedIcon sx={styles.icon} />
            </IconButton>
          </Tooltip>
          {readOnly ? null : (
            <>
              <IconButton
                aria-label={`${t('table.actions')} ${charge.code}`}
                onClick={(event) => setAnchor(event.currentTarget)}
                size="small"
                sx={styles.iconButton}
              >
                <MoreVertRoundedIcon sx={styles.icon} />
              </IconButton>
              <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
                <MenuItem onClick={choose(onEdit)}>{t('actions.edit')}</MenuItem>
                {locked ? null : (
                  <MenuItem onClick={choose(onCancel)}>{t('actions.cancel')}</MenuItem>
                )}
                {locked ? null : (
                  <MenuItem onClick={choose(onDelete)}>{t('actions.delete')}</MenuItem>
                )}
              </Menu>
            </>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  )
}

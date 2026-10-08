import { type MouseEvent, useState } from 'react'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'

import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'
import { formatCurrency } from '@shared/lib/utils/format'

import type { ChargeRowProps } from '../types/charge'
import { chargeStatusColors as statusColors } from './charge-status-colors'

export function ChargeRow({
  charge,
  locale,
  zebra,
  labels,
  onEdit,
  onArchive,
  onView,
}: ChargeRowProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const style = statusColors[charge.status]
  return (
    <TableRow
      sx={{
        height: 58,
        bgcolor: zebra ? surface.app : surface.paper,
        '&:hover': { bgcolor: alpha.graphite[6] },
      }}
    >
      <TableCell>
        <Button
          aria-label={`${labels.view} ${charge.code}`}
          onClick={onView}
          variant="text"
          sx={{ minWidth: 0, p: 0, color: brand.graphite[500], fontSize: 15.5, fontWeight: 900 }}
        >
          {charge.code}
        </Button>
      </TableCell>
      <TableCell>{charge.tenant}</TableCell>
      <TableCell>
        <Typography noWrap sx={{ color: 'text.secondary', fontSize: 14 }}>
          {charge.property}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography sx={{ fontWeight: 800, fontSize: 15.5 }}>
          {formatCurrency(charge.amount)}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography sx={{ color: 'text.secondary', fontSize: 15.5 }}>
          {new Intl.DateTimeFormat(locale).format(new Date(`${charge.dueDate}T12:00:00`))}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={labels.status}
          size="small"
          sx={{
            height: 30,
            bgcolor: style.bg,
            color: style.color,
            borderRadius: `${radius.full}px`,
            fontWeight: 900,
            fontSize: 13,
          }}
        />
      </TableCell>
      <TableCell>
        <Stack direction="row" justifyContent="center" alignItems="center">
          <Tooltip title={labels.view}>
            <IconButton
              aria-label={`${labels.view} ${charge.code}`}
              onClick={onView}
              size="small"
              sx={{ color: brand.neutral[500], '&:hover': { color: 'primary.main' } }}
            >
              <VisibilityOutlinedIcon sx={{ fontSize: iconSize.md }} />
            </IconButton>
          </Tooltip>
          <IconButton
            aria-label={`${labels.actions} ${charge.code}`}
            onClick={(event: MouseEvent<HTMLButtonElement>) => setAnchor(event.currentTarget)}
            size="small"
            sx={{ color: brand.neutral[500], '&:hover': { color: 'primary.main' } }}
          >
            <MoreVertRoundedIcon sx={{ fontSize: iconSize.md }} />
          </IconButton>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
            <MenuItem
              onClick={() => {
                onEdit()
                setAnchor(null)
              }}
            >
              {labels.edit}
            </MenuItem>
            <MenuItem
              onClick={() => {
                onArchive()
                setAnchor(null)
              }}
            >
              {labels.archive}
            </MenuItem>
          </Menu>
        </Stack>
      </TableCell>
    </TableRow>
  )
}

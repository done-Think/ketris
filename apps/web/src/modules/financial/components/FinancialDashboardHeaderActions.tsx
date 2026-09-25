'use client'

import { useMemo, useState, type MouseEvent } from 'react'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import { Box, Button, Menu, MenuItem, Stack } from '@mui/material'
import dayjs, { type Dayjs } from 'dayjs'

import { DashboardNotificationsButton } from '@shared/components/layout'
import { brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

export interface FinancialDashboardHeaderActionsProps {
  exportLabel: string
}

function formatMonthLabel(month: Dayjs) {
  const label = month.locale('pt-br').format('MMMM YYYY')

  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function FinancialDashboardHeaderActions({
  exportLabel,
}: FinancialDashboardHeaderActionsProps) {
  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => dayjs().locale('pt-br').subtract(index, 'month')),
    [],
  )
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0])
  const [monthAnchor, setMonthAnchor] = useState<HTMLElement | null>(null)

  const closeMonthMenu = () => setMonthAnchor(null)

  const handleMonthButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    setMonthAnchor(event.currentTarget)
  }

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.2}
      sx={{ width: { xs: '100%', md: 'auto' }, alignItems: { xs: 'stretch', sm: 'center' } }}
    >
      <Button
        type="button"
        variant="outlined"
        aria-haspopup="menu"
        aria-expanded={Boolean(monthAnchor)}
        onClick={handleMonthButtonClick}
        endIcon={<KeyboardArrowDownRoundedIcon sx={{ fontSize: iconSize.sm }} />}
        sx={{
          borderRadius: `${radius.sm}px`,
          fontSize: 14,
          fontWeight: 800,
          minHeight: 36,
          px: 2,
          whiteSpace: 'nowrap',
        }}
      >
        {formatMonthLabel(selectedMonth)}
      </Button>
      <Menu
        anchorEl={monthAnchor}
        open={Boolean(monthAnchor)}
        onClose={closeMonthMenu}
        slotProps={{
          paper: {
            sx: {
              mt: 0.6,
              minWidth: 180,
              borderRadius: `${radius.sm}px`,
              boxShadow: shadows.popover,
            },
          },
        }}
      >
        {monthOptions.map((month) => {
          const value = month.format('YYYY-MM')
          const selected = selectedMonth.isSame(month, 'month')

          return (
            <MenuItem
              key={value}
              selected={selected}
              onClick={() => {
                setSelectedMonth(month)
                closeMonthMenu()
              }}
              sx={{
                fontSize: 14,
                fontWeight: selected ? 900 : 700,
              }}
            >
              {formatMonthLabel(month)}
            </MenuItem>
          )
        })}
      </Menu>
      <Button
        type="button"
        variant="contained"
        startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
        sx={{
          borderRadius: `${radius.sm}px`,
          bgcolor: brand.magenta[500],
          boxShadow: shadows.none,
          color: surface.lightText,
          fontSize: 14,
          fontWeight: 800,
          minHeight: 36,
          px: 2,
          whiteSpace: 'nowrap',
          '&:hover': {
            bgcolor: brand.magenta[600],
            boxShadow: shadows.none,
          },
        }}
      >
        {exportLabel}
      </Button>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <DashboardNotificationsButton />
      </Box>
    </Stack>
  )
}

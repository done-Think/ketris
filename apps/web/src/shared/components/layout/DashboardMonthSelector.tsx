'use client'

import { useMemo, useState, type MouseEvent } from 'react'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import { Menu, MenuItem } from '@mui/material'
import dayjs, { type Dayjs } from 'dayjs'
import { useLocale } from 'next-intl'
import 'dayjs/locale/pt-br'
import 'dayjs/locale/es'

import { iconSize, radius, shadows } from '@shared/theme/tokens'

import { DashboardHeaderActionButton } from './DashboardHeaderActionButton'

function formatMonthLabel(month: Dayjs, locale: string) {
  const dayjsLocale = locale === 'es-ES' ? 'es' : locale === 'en-US' ? 'en' : 'pt-br'
  return month.locale(dayjsLocale).format('MMMM YYYY')
}

export function DashboardMonthSelector() {
  const locale = useLocale()
  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, index) => dayjs().subtract(index, 'month')),
    [],
  )
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0])
  const [monthAnchor, setMonthAnchor] = useState<HTMLElement | null>(null)

  const closeMonthMenu = () => setMonthAnchor(null)

  const handleMonthButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    setMonthAnchor(event.currentTarget)
  }

  return (
    <>
      <DashboardHeaderActionButton
        variant="outlined"
        aria-haspopup="menu"
        aria-expanded={Boolean(monthAnchor)}
        onClick={handleMonthButtonClick}
        endIcon={<KeyboardArrowDownRoundedIcon sx={{ fontSize: iconSize.sm }} />}
      >
        {formatMonthLabel(selectedMonth, locale)}
      </DashboardHeaderActionButton>
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
              {formatMonthLabel(month, locale)}
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}

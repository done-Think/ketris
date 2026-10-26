'use client'

import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import { Menu, MenuItem } from '@mui/material'
import { useFormatter } from 'next-intl'
import { useState } from 'react'

import type { DashboardMonthSelectorProps } from '@shared/types'

import { DashboardHeaderActionButton } from './DashboardHeaderActionButton'
import { getMonthOptionStyles, styles } from './dashboard-month-selector.styles'

export function DashboardMonthSelector({ value, options, onChange }: DashboardMonthSelectorProps) {
  const format = useFormatter()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const label = (month: string) =>
    format.dateTime(new Date(`${month}-01T12:00:00Z`), {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })

  return (
    <>
      <DashboardHeaderActionButton
        variant="outlined"
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        onClick={(event) => setAnchor(event.currentTarget)}
        endIcon={<KeyboardArrowDownRoundedIcon sx={styles.icon} />}
      >
        {label(value)}
      </DashboardHeaderActionButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: styles.paper } }}
      >
        {options.map((month) => (
          <MenuItem
            key={month}
            selected={month === value}
            onClick={() => {
              onChange(month)
              setAnchor(null)
            }}
            sx={getMonthOptionStyles(month === value)}
          >
            {label(month)}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

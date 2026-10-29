'use client'

import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import CancelScheduleSendOutlinedIcon from '@mui/icons-material/CancelScheduleSendOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import ScheduleSendOutlinedIcon from '@mui/icons-material/ScheduleSendOutlined'
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded'
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined'
import { ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material'
import { useTranslations } from 'next-intl'

import { getMenuIconStyles, getMenuTextStyles, styles } from '../styles/team-dialog.styles'
import type { BrokerTeamMenuProps } from '../types/broker-team'
import type { BrokerTeamMenuAction } from '../types/team'
import { teamMemberMenuActions } from '../utils/team-member'

const menuIcons: Record<BrokerTeamMenuAction, typeof BarChartRoundedIcon> = {
  performance: BarChartRoundedIcon,
  editGoal: TrackChangesOutlinedIcon,
  transferPortfolio: SwapHorizRoundedIcon,
  scheduleOneOnOne: EventAvailableOutlinedIcon,
  deactivate: PersonOffOutlinedIcon,
  activate: ReplayRoundedIcon,
  resendInvitation: ScheduleSendOutlinedIcon,
  cancelInvitation: CancelScheduleSendOutlinedIcon,
}

const dangerActions = new Set<BrokerTeamMenuAction>(['deactivate', 'cancelInvitation'])

export function BrokerTeamMenu({ menu, onClose, onSelect }: BrokerTeamMenuProps) {
  const t = useTranslations('dashboard.team.menu')

  return (
    <Menu
      id="broker-menu"
      anchorEl={menu?.anchorEl ?? null}
      open={Boolean(menu)}
      onClose={onClose}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      slotProps={{ paper: { sx: styles.menuPaper } }}
    >
      {(menu ? teamMemberMenuActions(menu.member) : []).map((action) => {
        const Icon = menuIcons[action]
        const danger = dangerActions.has(action)

        return (
          <MenuItem key={action} onClick={() => onSelect(action)}>
            <ListItemIcon sx={getMenuIconStyles(danger)}>
              <Icon sx={styles.menuIcon} />
            </ListItemIcon>
            <ListItemText
              primary={t(action)}
              slotProps={{ primary: { sx: getMenuTextStyles(danger) } }}
            />
          </MenuItem>
        )
      })}
    </Menu>
  )
}

import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined'
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined'

import type { ProfileAction } from '../types/user-profile'

export const profileActions: ProfileAction[] = [
  { labelKey: 'support', icon: SupportAgentOutlinedIcon, href: '/login' },
  { labelKey: 'settings', icon: SettingsOutlinedIcon, href: '/login' },
  { labelKey: 'switchMode', icon: SwapHorizOutlinedIcon, href: '/properties' },
  { labelKey: 'signOut', icon: LogoutOutlinedIcon, tone: 'danger' },
]

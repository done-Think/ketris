import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined'
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined'

import type { ProfileAction, UserProfile } from '../types/user-profile'

export const userProfile: UserProfile = {
  name: 'Rafael Martins',
  company: 'Ketris Prime',
  email: 'rafael@ketris.com.br',
  avatar:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
}

export const profileActions: ProfileAction[] = [
  { labelKey: 'support', icon: SupportAgentOutlinedIcon, href: '/login' },
  { labelKey: 'settings', icon: SettingsOutlinedIcon, href: '/login' },
  { labelKey: 'switchMode', icon: SwapHorizOutlinedIcon, href: '/properties' },
  { labelKey: 'signOut', icon: LogoutOutlinedIcon, href: '/login', tone: 'danger' },
]

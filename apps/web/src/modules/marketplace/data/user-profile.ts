import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined'
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined'

import { publicMarketplaceText } from '@shared/i18n/pt-br'

import type { ProfileAction, UserProfile } from '../types/user-profile'

const profileText = publicMarketplaceText.profile

export const userProfile: UserProfile = {
  name: 'Rafael Martins',
  role: profileText.role,
  company: 'Ketris Prime',
  email: 'rafael@ketris.com.br',
  avatar:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
}

export const profileActions: ProfileAction[] = [
  { label: profileText.actions.support, icon: SupportAgentOutlinedIcon, href: '/login' },
  { label: profileText.actions.settings, icon: SettingsOutlinedIcon, href: '/login' },
  { label: profileText.actions.switchMode, icon: SwapHorizOutlinedIcon, href: '/imoveis' },
  { label: profileText.actions.signOut, icon: LogoutOutlinedIcon, href: '/login', tone: 'danger' },
]

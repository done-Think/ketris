import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import InsertChartOutlinedRoundedIcon from '@mui/icons-material/InsertChartOutlinedRounded'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined'

import type { AppShellNavItem } from '@shared/types/app-shell'

export const appShellNavigationItems: readonly AppShellNavItem[] = [
  {
    labelKey: 'dashboard',
    href: '/dashboard',
    icon: BarChartOutlinedIcon,
    roles: ['ADMIN', 'OWNER'],
  },
  {
    labelKey: 'agencyOverview',
    href: '/dashboard/agency-overview',
    icon: InsertChartOutlinedRoundedIcon,
    roles: ['ADMIN', 'OWNER'],
  },
  { labelKey: 'pipeline', href: '/crm', icon: ViewKanbanOutlinedIcon },
  { labelKey: 'contacts', href: '/crm/contacts', icon: PeopleOutlineIcon },
  { labelKey: 'leads', href: '/dashboard/leads', icon: PeopleAltOutlinedIcon },
  {
    labelKey: 'team',
    href: '/dashboard/team',
    icon: PeopleAltOutlinedIcon,
    roles: ['ADMIN', 'OWNER'],
  },
  { labelKey: 'properties', href: '/dashboard/properties', icon: HomeWorkOutlinedIcon },
  { labelKey: 'contracts', href: '/dashboard/contracts', icon: DescriptionOutlinedIcon },
  {
    labelKey: 'publicProfile',
    href: '/dashboard/public-profile',
    icon: PaletteOutlinedIcon,
    roles: ['AGENT'],
  },
  {
    labelKey: 'agencyPublicProfile',
    href: '/dashboard/public-profile/agency',
    icon: PaletteOutlinedIcon,
    roles: ['ADMIN', 'OWNER'],
  },
  { labelKey: 'agenda', href: '/dashboard/agenda', icon: CalendarTodayOutlinedIcon },
  {
    labelKey: 'maintenance',
    href: '/dashboard/maintenance',
    icon: BuildOutlinedIcon,
    roles: ['ADMIN', 'OWNER'],
  },
  {
    labelKey: 'finance',
    href: '/dashboard/finance',
    icon: InsertChartOutlinedRoundedIcon,
    roles: ['ADMIN', 'OWNER'],
  },
  {
    labelKey: 'charges',
    href: '/dashboard/finance/charges',
    icon: ReceiptLongOutlinedIcon,
    roles: ['ADMIN', 'OWNER'],
  },
]

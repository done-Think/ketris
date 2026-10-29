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

import { agencyStaffRoles } from '@server/auth/domain/roles'
import type { AppShellNavItem } from '@shared/types/app-shell'

export const appShellNavigationItems: readonly AppShellNavItem[] = [
  {
    labelKey: 'dashboard',
    href: '/dashboard',
    icon: BarChartOutlinedIcon,
    roles: ['OWNER'],
  },
  { labelKey: 'pipeline', href: '/crm', icon: ViewKanbanOutlinedIcon, roles: agencyStaffRoles },
  {
    labelKey: 'contacts',
    href: '/crm/contacts',
    icon: PeopleOutlineIcon,
    roles: agencyStaffRoles,
  },
  {
    labelKey: 'leads',
    href: '/dashboard/leads',
    icon: PeopleAltOutlinedIcon,
    roles: agencyStaffRoles,
  },
  {
    labelKey: 'team',
    href: '/dashboard/team',
    icon: PeopleAltOutlinedIcon,
    roles: ['OWNER'],
  },
  { labelKey: 'properties', href: '/dashboard/properties', icon: HomeWorkOutlinedIcon },
  {
    labelKey: 'contracts',
    href: '/dashboard/contracts',
    icon: DescriptionOutlinedIcon,
    roles: ['OWNER', 'AGENT', 'PROPERTY_OWNER'],
  },
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
    roles: ['OWNER'],
  },
  { labelKey: 'agenda', href: '/dashboard/agenda', icon: CalendarTodayOutlinedIcon },
  {
    labelKey: 'maintenance',
    href: '/dashboard/maintenance',
    icon: BuildOutlinedIcon,
    roles: ['OWNER', 'AGENT', 'RENTER', 'PROPERTY_OWNER'],
  },
  {
    labelKey: 'finance',
    href: '/dashboard/finance',
    icon: InsertChartOutlinedRoundedIcon,
    roles: ['OWNER'],
  },
  {
    labelKey: 'charges',
    href: '/dashboard/finance/charges',
    icon: ReceiptLongOutlinedIcon,
    roles: ['OWNER', 'RENTER', 'PROPERTY_OWNER'],
  },
]

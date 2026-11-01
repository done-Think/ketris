'use client'

import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded'
import ManageSearchRoundedIcon from '@mui/icons-material/ManageSearchRounded'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import { Badge, Box, Button } from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { getPathname, usePathname } from '@/i18n/navigation'
import { defaultLocale, isAppLocale } from '@/i18n/routing'
import { hasLostFaceCheckAccess } from '../../utils/query-access'
import { useOverview } from '../../hooks/use-console-queries'
import type { ConsoleNavProps } from '../../types/console.types'
import { consoleNavStyles as styles } from '../../styles/console-nav.styles'

const items = [
  { key: 'overview', href: { pathname: '/dashboard/face_check' }, Icon: BarChartOutlinedIcon },
  {
    key: 'sessions',
    href: { pathname: '/dashboard/face_check/sessions' },
    Icon: FormatListBulletedRoundedIcon,
  },
  {
    key: 'review',
    href: { pathname: '/dashboard/face_check/sessions', query: { filter: 'review' } },
    Icon: ManageSearchRoundedIcon,
  },
  {
    key: 'settings',
    href: { pathname: '/dashboard/face_check/settings' },
    Icon: SettingsOutlinedIcon,
  },
] as const

export function ConsoleNav({ reviewActive, onNavigate }: ConsoleNavProps) {
  const t = useTranslations('face_check.console.nav')
  const currentLocale = useLocale()
  const locale = isAppLocale(currentLocale) ? currentLocale : defaultLocale
  const pathname = usePathname()
  const overview = useOverview('real')
  const reviewCount = hasLostFaceCheckAccess(overview.error) ? 0 : overview.data?.inReview
  const active = pathname.includes('/settings')
    ? 'settings'
    : pathname.includes('/sessions')
      ? reviewActive
        ? 'review'
        : 'sessions'
      : 'overview'
  return (
    <Box component="nav" aria-label={t('label')} sx={styles.root}>
      {items.map(({ key, href, Icon }) => (
        <Button
          key={key}
          component="a"
          href={getPathname({ locale, href })}
          onClick={onNavigate}
          aria-current={active === key ? 'page' : undefined}
          variant={active === key ? 'contained' : 'text'}
          startIcon={<Icon />}
          sx={styles.item}
        >
          <Badge badgeContent={key === 'review' ? reviewCount : 0} color="error">
            {t(key)}
          </Badge>
        </Button>
      ))}
    </Box>
  )
}
export function ConsoleNavWithParams() {
  const params = useSearchParams()
  return <ConsoleNav reviewActive={params.get('filter') === 'review'} />
}

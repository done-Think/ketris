'use client'

import { useMemo, useState } from 'react'
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined'
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded'
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined'
import {
  Box,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useForm, useWatch } from 'react-hook-form'

import { useRouter } from '@/i18n/navigation'
import { RhfTextField } from '@shared/components/form'
import {
  DashboardHeaderActionButton,
  DashboardNotificationsButton,
  DashboardPageHeader,
} from '@shared/components/layout'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import { BrokerTeamCard } from './BrokerTeamCard'
import { brokerTeamKpis, brokerTeamMembers } from '../data/broker-team'
import type {
  BrokerTeamFiltersFormValues,
  BrokerTeamMember,
  BrokerTeamMenu,
  BrokerTeamMenuAction,
} from '../types/broker-team'

const teamBodyFontFamily = 'var(--font-inter), system-ui, -apple-system, sans-serif'

const brokerMenuActions = [
  { id: 'performance', icon: BarChartRoundedIcon },
  { id: 'editGoal', icon: TrackChangesOutlinedIcon },
  { id: 'transferPortfolio', icon: SwapHorizRoundedIcon },
  { id: 'scheduleOneOnOne', icon: EventAvailableOutlinedIcon },
  { id: 'deactivate', icon: PersonOffOutlinedIcon },
] as const satisfies readonly { id: BrokerTeamMenuAction; icon: typeof BarChartRoundedIcon }[]

function normalizeSearchValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}

function matchesBrokerSearch(broker: BrokerTeamMember, searchQuery: string) {
  const normalizedSearch = normalizeSearchValue(searchQuery)
  if (!normalizedSearch) return true

  return [broker.name, broker.role, broker.specialty].some((value) =>
    normalizeSearchValue(value).includes(normalizedSearch),
  )
}

export function BrokerTeamDashboardPage() {
  const router = useRouter()
  const t = useTranslations('dashboard.team')
  const { enqueueSnackbar } = useSnackbar()
  const [brokerMenu, setBrokerMenu] = useState<BrokerTeamMenu | null>(null)
  const { control } = useForm<BrokerTeamFiltersFormValues>({
    defaultValues: {
      searchQuery: '',
    },
  })
  const searchQuery = useWatch({ control, name: 'searchQuery' })
  const filteredBrokers = useMemo(
    () => brokerTeamMembers.filter((broker) => matchesBrokerSearch(broker, searchQuery)),
    [searchQuery],
  )
  const openBrokerProfile = (broker: BrokerTeamMember) => {
    router.push({ pathname: '/brokers/[id]', params: { id: broker.profileId } })
  }
  const openBrokerMenu = (anchorEl: HTMLElement, broker: BrokerTeamMember) => {
    setBrokerMenu({ anchorEl, broker })
  }
  const closeBrokerMenu = () => {
    setBrokerMenu(null)
  }
  const handleBrokerMenuAction = (action: BrokerTeamMenuAction) => {
    if (!brokerMenu) return

    enqueueSnackbar(
      t('menu.feedback', {
        action: t(`menu.${action}`),
        name: brokerMenu.broker.name,
      }),
      { variant: 'info' },
    )
    closeBrokerMenu()
  }

  return (
    <Box
      sx={{
        width: '100%',
        p: 3.5,
      }}
    >
      <Stack spacing={2.2}>
        <DashboardPageHeader
          title={t('title')}
          subtitle={t('subtitle')}
          actions={
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ sm: 'center' }}
              spacing={1.2}
              sx={{ width: { xs: '100%', lg: 'auto' } }}
            >
              <RhfTextField
                control={control}
                name="searchQuery"
                placeholder={t('searchPlaceholder')}
                size="small"
                sx={{
                  width: { xs: '100%', sm: 300 },
                  '& .MuiOutlinedInput-root': {
                    height: { xs: 40, sm: 32 },
                    bgcolor: surface.paper,
                    borderRadius: `${radius.sm}px`,
                    fontSize: 12,
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon
                        sx={{ color: brand.neutral[400], fontSize: iconSize.sm }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
              <DashboardHeaderActionButton
                startIcon={<PersonAddAlt1OutlinedIcon sx={{ fontSize: iconSize.sm }} />}
              >
                {t('inviteBroker')}
              </DashboardHeaderActionButton>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <DashboardNotificationsButton />
              </Box>
            </Stack>
          }
        />

        <Stack
          spacing={2.2}
          sx={{
            fontFamily: teamBodyFontFamily,
            '& .MuiTypography-root, & .MuiButton-root, & .MuiInputBase-root': {
              fontFamily: teamBodyFontFamily,
            },
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))',
              },
              gap: 1.4,
            }}
          >
            {brokerTeamKpis.map((kpi) => (
              <Paper
                key={kpi.id}
                variant="outlined"
                sx={{
                  p: { xs: 1.5, md: 1.8 },
                  borderColor: alpha.graphite[8],
                  borderRadius: `${radius.sm}px`,
                  bgcolor: surface.paper,
                  boxShadow: shadows.crmListPanel,
                }}
              >
                <Stack spacing={0.4}>
                  <Typography sx={{ color: brand.neutral[500], fontSize: 11.5, fontWeight: 800 }}>
                    {t(`kpis.${kpi.labelKey}`)}
                  </Typography>
                  <Typography sx={{ color: brand.graphite[500], fontSize: 24, fontWeight: 900 }}>
                    {kpi.value}
                  </Typography>
                  <Typography sx={{ color: brand.neutral[500], fontSize: 11.5 }}>
                    {t(`kpis.${kpi.helperKey}`)}
                  </Typography>
                </Stack>
              </Paper>
            ))}
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
                xl: 'repeat(3, minmax(0, 1fr))',
              },
              gap: 1.8,
            }}
          >
            {filteredBrokers.map((broker) => (
              <BrokerTeamCard
                key={broker.id}
                broker={broker}
                isMenuOpen={brokerMenu?.broker.id === broker.id}
                onOpenProfile={openBrokerProfile}
                onOpenMenu={openBrokerMenu}
              />
            ))}
          </Box>

          <Menu
            id="broker-menu"
            anchorEl={brokerMenu?.anchorEl ?? null}
            open={Boolean(brokerMenu)}
            onClose={closeBrokerMenu}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            slotProps={{
              paper: {
                sx: {
                  mt: 0.8,
                  minWidth: 220,
                  border: '1px solid',
                  borderColor: alpha.graphite[8],
                  borderRadius: `${radius.sm}px`,
                  boxShadow: shadows.crmListPanel,
                },
              },
            }}
          >
            {brokerMenuActions.map((action) => {
              const Icon = action.icon
              const isDeactivateAction = action.id === 'deactivate'

              return (
                <MenuItem key={action.id} onClick={() => handleBrokerMenuAction(action.id)}>
                  <ListItemIcon
                    sx={{
                      color: isDeactivateAction ? brand.semantic.error : brand.neutral[500],
                      minWidth: 34,
                    }}
                  >
                    <Icon sx={{ fontSize: iconSize.md }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={t(`menu.${action.id}`)}
                    primaryTypographyProps={{
                      color: isDeactivateAction ? brand.semantic.error : brand.graphite[500],
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  />
                </MenuItem>
              )
            })}
          </Menu>

          {filteredBrokers.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                display: 'grid',
                minHeight: 180,
                placeItems: 'center',
                borderColor: alpha.graphite[8],
                borderRadius: `${radius.md}px`,
                bgcolor: surface.paper,
              }}
            >
              <Typography sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 700 }}>
                {t('empty')}
              </Typography>
            </Paper>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  )
}

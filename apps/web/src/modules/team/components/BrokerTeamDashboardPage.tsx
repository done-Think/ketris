'use client'

import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useSession } from 'next-auth/react'
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
import { AgendaEventFormDialog } from '@modules/agenda/components/AgendaEventFormDialog'
import { useCreateAgendaEvent } from '@modules/agenda/hooks/use-agenda-events'
import { agendaOtherPropertyValue } from '@modules/agenda/schemas/agenda-event-form-schema'
import type { AgendaEventFormValues } from '@modules/agenda/types/agenda-event'
import { RhfTextField } from '@shared/components/form'
import {
  DashboardHeaderActionButton,
  DashboardNotificationsButton,
  DashboardPageHeader,
} from '@shared/components/layout'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import { brokerTeamKpis, brokerTeamMembers } from '../data/broker-team'
import {
  BrokerDeactivateDialog,
  BrokerGoalDialog,
  BrokerPerformanceDialog,
  BrokerTransferDialog,
} from './BrokerTeamActionDialogs'
import { BrokerTeamCard } from './BrokerTeamCard'
import type {
  BrokerTransferFormValues,
  BrokerTeamFiltersFormValues,
  BrokerTeamMember,
  BrokerTeamMenuAction,
} from '../types/broker-team'

const teamBodyFontFamily =
  'var(--font-primary), system-ui, -apple-system, BlinkMacSystemFont, sans-serif'

const brokerMenuActions = [
  { id: 'performance', icon: BarChartRoundedIcon },
  { id: 'editGoal', icon: TrackChangesOutlinedIcon },
  { id: 'transferPortfolio', icon: SwapHorizRoundedIcon },
  { id: 'scheduleOneOnOne', icon: EventAvailableOutlinedIcon },
  { id: 'deactivate', icon: PersonOffOutlinedIcon },
] as const satisfies readonly { id: BrokerTeamMenuAction; icon: typeof BarChartRoundedIcon }[]

function normalizeSearchValue(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('pt-BR').trim()
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
  const { data: session } = useSession()
  const createAgendaEvent = useCreateAgendaEvent(session?.tenantId ?? '')
  const [brokers, setBrokers] = useState<BrokerTeamMember[]>(() => [...brokerTeamMembers])
  const [action, setAction] = useState<{ type: BrokerTeamMenuAction; brokerId: string } | null>(
    null,
  )
  const [brokerMenu, setBrokerMenu] = useState<{
    anchorEl: HTMLElement
    broker: BrokerTeamMember
  } | null>(null)
  const { control } = useForm<BrokerTeamFiltersFormValues>({
    defaultValues: {
      searchQuery: '',
    },
  })
  const searchQuery = useWatch({ control, name: 'searchQuery' })
  const filteredBrokers = useMemo(
    () => brokers.filter((broker) => matchesBrokerSearch(broker, searchQuery)),
    [brokers, searchQuery],
  )
  const selectedBroker = brokers.find((broker) => broker.id === action?.brokerId) ?? null
  const today = dayjs().startOf('day')
  const agendaInitialValues = useMemo<Partial<AgendaEventFormValues> | undefined>(() => {
    if (action?.type !== 'scheduleOneOnOne' || !selectedBroker) return undefined
    return {
      title: t('dialogs.oneOnOneTitle', { name: selectedBroker.name }),
      participant: selectedBroker.name,
      kind: 'MEETING',
      propertyId: agendaOtherPropertyValue,
      customProperty: t('dialogs.internalMeeting'),
    }
  }, [action?.type, selectedBroker, t])
  const kpiValues: Record<string, string> = {
    'active-brokers': String(brokers.filter((broker) => broker.active).length),
    properties: String(brokers.reduce((total, broker) => total + broker.properties, 0)),
    'monthly-sales': String(brokers.reduce((total, broker) => total + broker.monthlySales, 0)),
    'average-goal': `${Math.round(brokers.reduce((total, broker) => total + broker.goalProgress, 0) / brokers.length)}%`,
  }
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
    if (
      action === 'deactivate' &&
      !brokers.find((broker) => broker.id === brokerMenu.broker.id)?.active
    ) {
      setBrokers((current) =>
        current.map((broker) =>
          broker.id === brokerMenu.broker.id ? { ...broker, active: true } : broker,
        ),
      )
      enqueueSnackbar(t('dialogs.activated'), { variant: 'success' })
    } else {
      setAction({ type: action, brokerId: brokerMenu.broker.id })
    }
    closeBrokerMenu()
  }
  const saveGoal = (brokerId: string, monthlyGoal: number) => {
    setBrokers((current) =>
      current.map((broker) => {
        if (broker.id !== brokerId) return broker
        const goalProgress = Math.round((broker.monthlySales / monthlyGoal) * 100)
        return {
          ...broker,
          monthlyGoal,
          goalProgress,
          status: goalProgress >= 90 ? 'ahead' : goalProgress >= 70 ? 'onTrack' : 'attention',
        }
      }),
    )
    setAction(null)
    enqueueSnackbar(t('dialogs.goalSaved'), { variant: 'success' })
  }
  const transferPortfolio = (sourceId: string, values: BrokerTransferFormValues) => {
    const source = brokers.find((broker) => broker.id === sourceId)
    const destination = brokers.find(
      (broker) => broker.id === values.destinationId && broker.active,
    )
    if (
      !source ||
      !destination ||
      source.id === destination.id ||
      (!values.leads && !values.properties)
    ) {
      enqueueSnackbar(t('dialogs.transferError'), { variant: 'error' })
      return
    }
    setBrokers((current) =>
      current.map((broker) => {
        if (broker.id === sourceId)
          return {
            ...broker,
            leads: values.leads ? 0 : broker.leads,
            properties: values.properties ? 0 : broker.properties,
          }
        if (broker.id === destination.id)
          return {
            ...broker,
            leads: broker.leads + (values.leads ? source.leads : 0),
            properties: broker.properties + (values.properties ? source.properties : 0),
          }
        return broker
      }),
    )
    setAction(null)
    enqueueSnackbar(t('dialogs.transferred'), { variant: 'success' })
  }
  const deactivateBroker = (brokerId: string) => {
    setBrokers((current) =>
      current.map((broker) => (broker.id === brokerId ? { ...broker, active: false } : broker)),
    )
    setAction(null)
    enqueueSnackbar(t('dialogs.deactivated'), { variant: 'success' })
  }
  const scheduleOneOnOne = async (values: AgendaEventFormValues) => {
    try {
      await createAgendaEvent.mutateAsync({
        title: values.title,
        kind: values.kind || undefined,
        ...(values.propertyId === agendaOtherPropertyValue
          ? { propertyReference: values.customProperty.trim() }
          : { propertyId: values.propertyId }),
        start: dayjs(`${values.scheduledDate}T${values.scheduledTime}`).toISOString(),
        durationMinutes: values.durationMinutes,
        participantName: values.participant,
        participantPhone: values.phone,
        notes: values.notes.trim(),
      })
      setAction(null)
      enqueueSnackbar(t('dialogs.scheduled'), { variant: 'success' })
    } catch {
      enqueueSnackbar(t('dialogs.scheduleError'), { variant: 'error' })
    }
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
                    {kpiValues[kpi.id] ?? kpi.value}
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
                    primary={
                      action.id === 'deactivate' &&
                      brokerMenu &&
                      !brokers.find((broker) => broker.id === brokerMenu.broker.id)?.active
                        ? t('dialogs.activate')
                        : t(`menu.${action.id}`)
                    }
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

          <BrokerPerformanceDialog
            broker={action?.type === 'performance' ? selectedBroker : null}
            onClose={() => setAction(null)}
          />
          <BrokerGoalDialog
            broker={action?.type === 'editGoal' ? selectedBroker : null}
            onClose={() => setAction(null)}
            onSave={saveGoal}
          />
          <BrokerTransferDialog
            broker={action?.type === 'transferPortfolio' ? selectedBroker : null}
            brokers={brokers}
            onClose={() => setAction(null)}
            onTransfer={transferPortfolio}
          />
          <BrokerDeactivateDialog
            broker={action?.type === 'deactivate' ? selectedBroker : null}
            onClose={() => setAction(null)}
            onConfirm={deactivateBroker}
          />
          <AgendaEventFormDialog
            open={action?.type === 'scheduleOneOnOne'}
            onClose={() => setAction(null)}
            onCreate={scheduleOneOnOne}
            initialValues={agendaInitialValues}
            minDate={today.format('YYYY-MM-DD')}
            maxDate={today.add(6, 'month').endOf('month').format('YYYY-MM-DD')}
            propertyOptions={[]}
          />

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

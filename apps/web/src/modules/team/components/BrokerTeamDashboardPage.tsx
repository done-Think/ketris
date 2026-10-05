'use client'

import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useSession } from 'next-auth/react'
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined'
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded'
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import {
  Avatar,
  Box,
  ButtonBase,
  Chip,
  IconButton,
  InputAdornment,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tooltip,
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
import {
  alpha,
  brand,
  iconSize,
  radius,
  shadows,
  surface,
  supportColor,
} from '@shared/theme/tokens'

import { brokerTeamKpis, brokerTeamMembers } from '../data/broker-team'
import {
  BrokerDeactivateDialog,
  BrokerGoalDialog,
  BrokerPerformanceDialog,
  BrokerTransferDialog,
} from './BrokerTeamActionDialogs'
import type {
  BrokerTransferFormValues,
  BrokerTeamFiltersFormValues,
  BrokerTeamMember,
  BrokerTeamMenuAction,
  BrokerTeamStatus,
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

const statusPresentation: Record<BrokerTeamStatus, { color: string; bgcolor: string }> = {
  ahead: { color: brand.semantic.success, bgcolor: supportColor.successSoft },
  onTrack: { color: brand.magenta[700], bgcolor: alpha.magenta[10] },
  attention: { color: brand.semantic.warning, bgcolor: supportColor.warningSoft },
}

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

        {/* fontFamily aplicado só a partir daqui — se subisse pro Stack/Box que também envolve o
        DashboardPageHeader, o seletor '& .MuiTypography-root' bateria no h1 da marca (Space
        Grotesk) e derrubaria a fonte pra Inter, quebrando a padronização visual do cabeçalho. */}
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
            {filteredBrokers.map((broker) => {
              const presentation = broker.active
                ? statusPresentation[broker.status]
                : { color: brand.neutral[500], bgcolor: alpha.graphite[8] }

              return (
                <Paper
                  key={broker.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderColor: alpha.graphite[8],
                    borderRadius: `${radius.md}px`,
                    bgcolor: surface.paper,
                    boxShadow: shadows.crmCardCompact,
                  }}
                >
                  <Stack spacing={1.6}>
                    <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                      <ButtonBase
                        aria-label={t('viewProfileAriaLabel', { name: broker.name })}
                        onClick={() => openBrokerProfile(broker)}
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          alignItems: 'flex-start',
                          justifyContent: 'flex-start',
                          gap: 1.5,
                          borderRadius: `${radius.sm}px`,
                          textAlign: 'left',
                          '&:hover .broker-card-name, &:focus-visible .broker-card-name': {
                            color: brand.magenta[700],
                          },
                          '&:focus-visible': {
                            outline: `2px solid ${alpha.magenta[36]}`,
                            outlineOffset: 3,
                          },
                        }}
                      >
                        <Avatar
                          src={broker.avatarUrl}
                          alt={broker.name}
                          sx={{ width: 52, height: 52, bgcolor: brand.magenta[500] }}
                        />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            noWrap
                            className="broker-card-name"
                            sx={{
                              color: brand.graphite[500],
                              fontSize: 15,
                              fontWeight: 900,
                              lineHeight: '20px',
                              letterSpacing: 0,
                              transition: 'color 160ms ease',
                            }}
                          >
                            {broker.name}
                          </Typography>
                          <Chip
                            label={broker.role}
                            size="small"
                            sx={{
                              mt: 0.5,
                              height: 22,
                              borderRadius: `${radius.sm}px`,
                              bgcolor: alpha.magenta[10],
                              color: brand.magenta[700],
                              fontSize: 11,
                              fontWeight: 900,
                              lineHeight: '16px',
                              letterSpacing: 0,
                              '& .MuiChip-label': { px: 0.9 },
                            }}
                          />
                        </Box>
                      </ButtonBase>
                      <Tooltip title={t('moreOptions')}>
                        <IconButton
                          aria-label={t('moreOptions')}
                          aria-controls={
                            brokerMenu?.broker.id === broker.id ? 'broker-menu' : undefined
                          }
                          aria-expanded={brokerMenu?.broker.id === broker.id ? 'true' : undefined}
                          aria-haspopup="menu"
                          onClick={(event) => openBrokerMenu(event.currentTarget, broker)}
                          sx={{ mt: -0.5 }}
                        >
                          <MoreVertRoundedIcon sx={{ fontSize: iconSize.md }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                        gap: 1,
                        pt: 1.4,
                        borderTop: '1px solid',
                        borderColor: alpha.graphite[8],
                      }}
                    >
                      {[
                        { label: t('metrics.properties'), value: broker.properties },
                        { label: t('metrics.leads'), value: broker.leads },
                        { label: t('metrics.monthlySales'), value: broker.monthlySales },
                      ].map((metric) => (
                        <Box key={metric.label} sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{ color: brand.graphite[500], fontSize: 15, fontWeight: 900 }}
                          >
                            {metric.value}
                          </Typography>
                          <Typography noWrap sx={{ color: brand.neutral[500], fontSize: 10.5 }}>
                            {metric.label}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    <Stack spacing={0.85}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography sx={{ color: brand.neutral[500], fontSize: 11.5 }}>
                          {t('goalProgress')}
                        </Typography>
                        <Typography
                          sx={{ color: presentation.color, fontSize: 11.5, fontWeight: 900 }}
                        >
                          {broker.goalProgress}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, broker.goalProgress)}
                        sx={{
                          height: 6,
                          borderRadius: radius.full,
                          bgcolor: alpha.magenta[8],
                          '& .MuiLinearProgress-bar': {
                            borderRadius: radius.full,
                            bgcolor: presentation.color,
                          },
                        }}
                      />
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ minWidth: 0 }}>
                      <Chip
                        icon={<TrendingUpRoundedIcon sx={{ fontSize: iconSize.xs }} />}
                        label={
                          broker.active ? t(`statuses.${broker.status}`) : t('dialogs.inactive')
                        }
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          justifyContent: 'flex-start',
                          borderRadius: `${radius.sm}px`,
                          bgcolor: presentation.bgcolor,
                          color: presentation.color,
                          fontSize: 11,
                          fontWeight: 900,
                          '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
                        }}
                      />
                      <Typography
                        sx={{
                          flexShrink: 0,
                          alignSelf: 'center',
                          color: brand.neutral[500],
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {t('returns', { count: broker.returns })}
                      </Typography>
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={0.9}
                      sx={{
                        '& .MuiIconButton-root': {
                          flex: 1,
                          height: 34,
                          borderRadius: `${radius.sm}px`,
                          bgcolor: surface.app,
                          color: brand.graphite[500],
                          '&:hover': { bgcolor: alpha.magenta[8], color: brand.magenta[700] },
                        },
                      }}
                    >
                      <Tooltip title={t('actions.message')}>
                        <IconButton aria-label={t('actions.message')}>
                          <ChatBubbleOutlineRoundedIcon sx={{ fontSize: iconSize.md }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('actions.email')}>
                        <IconButton aria-label={t('actions.email')}>
                          <EmailOutlinedIcon sx={{ fontSize: iconSize.md }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('actions.call')}>
                        <IconButton aria-label={t('actions.call')}>
                          <PhoneOutlinedIcon sx={{ fontSize: iconSize.md }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Paper>
              )
            })}
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

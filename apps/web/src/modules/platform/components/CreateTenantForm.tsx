'use client'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSnackbar } from 'notistack'
import { useFormatter, useTranslations } from 'next-intl'

import { Link, useRouter } from '@/i18n/navigation'
import { RhfTextField } from '@shared/components/form'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'
import { extractErrorMessage } from '@shared/utils/error-message'

import { useCreateTenant } from '../hooks/use-create-tenant'
import { usePlatformPlans } from '../hooks/use-platform-plans'
import { createTenantSchema } from '../schemas/create-tenant-schema'
import type { ApiPlatformPlan } from '../types/platform-plan'
import { TENANT_ACCOUNT_TYPES, type CreateTenantFormValues } from '../types/tenant'
import { accountTypeIcons } from '../utils/account-type-icons'
import { slugifyTenantName } from '../utils/tenant-slug'
import { CreateTenantSummary } from './CreateTenantSummary'

export function CreateTenantForm() {
  const t = useTranslations('platform.createAccount')
  const formsT = useTranslations('platform.forms')
  const accountT = useTranslations('platform.account')
  const plansT = useTranslations('platform.plans')
  const format = useFormatter()
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const createTenant = useCreateTenant()
  const plansQuery = usePlatformPlans()
  const schema = useMemo(() => createTenantSchema((key) => formsT(`errors.${key}`)), [formsT])
  // The slug follows the name until the admin edits it by hand.
  const slugEditedByHand = useRef(false)

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting, isSubmitted },
  } = useForm<CreateTenantFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', slug: '', accountType: 'AGENCY', startAsTrial: false },
  })

  useEffect(() => {
    const subscription = watch((values, { name: field, type }) => {
      // Only react to what the admin types, not to the slug we set ourselves.
      if (type !== 'change') return
      if (field === 'slug') {
        // Clearing the field hands it back to the automatic suggestion.
        slugEditedByHand.current = Boolean(values.slug)
        return
      }
      if (field === 'name' && !slugEditedByHand.current) {
        setValue('slug', slugifyTenantName(values.name ?? ''), { shouldValidate: isSubmitted })
      }
    })

    return () => subscription.unsubscribe()
  }, [isSubmitted, setValue, watch])

  const [name, slug, accountType, startAsTrial] = watch([
    'name',
    'slug',
    'accountType',
    'startAsTrial',
  ])
  const plans = plansQuery.data
  const planOf = (type: CreateTenantFormValues['accountType']) =>
    plans?.find((plan) => plan.accountType === type)
  const formatPrice = (value: number) =>
    format.number(value, { style: 'currency', currency: 'BRL' })

  async function onSubmit(values: CreateTenantFormValues) {
    try {
      const tenant = await createTenant.mutateAsync({
        name: values.name,
        slug: values.slug,
        accountType: values.accountType,
        status: values.startAsTrial ? 'TRIAL' : 'ACTIVE',
      })
      enqueueSnackbar(t('createSuccess', { name: tenant.name }), { variant: 'success' })
      router.push({ pathname: '/platform/tenants/[id]', params: { id: tenant.id } })
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error, t('createError')), { variant: 'error' })
    }
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 360px' },
        gap: 2.4,
        alignItems: 'start',
        maxWidth: 1180,
      }}
    >
      <Card variant="outlined" sx={cardSx}>
        <Section
          step={1}
          title={t('sections.accountType.title')}
          description={t('sections.accountType.description')}
        >
          <Controller
            control={control}
            name="accountType"
            render={({ field }) => (
              <Box
                role="radiogroup"
                aria-label={t('sections.accountType.title')}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                  gap: 1.2,
                }}
              >
                {TENANT_ACCOUNT_TYPES.map((type) => (
                  <AccountTypeOption
                    key={type}
                    name={field.name}
                    value={type}
                    selected={field.value === type}
                    onSelect={() => field.onChange(type)}
                    label={accountT(`accountTypes.${type}`)}
                    plan={planOf(type)}
                    price={(plan) => t('pricePerMonth', { price: formatPrice(plan.monthlyPrice) })}
                    includes={(plan) =>
                      plansT(
                        plan.usageUnit === 'BROKERS' ? 'includesBrokers' : 'includesProperties',
                        {
                          count: plan.includedUnits,
                        },
                      )
                    }
                  />
                ))}
              </Box>
            )}
          />
        </Section>

        <Divider sx={{ borderColor: alpha.graphite[6] }} />

        <Section
          step={2}
          title={t('sections.identity.title')}
          description={t('sections.identity.description')}
        >
          <Stack spacing={2.2}>
            <RhfTextField
              control={control}
              name="name"
              label={formsT('name')}
              placeholder={formsT('namePlaceholder')}
              fullWidth
              autoFocus
            />
            <RhfTextField
              control={control}
              name="slug"
              label={formsT('slugLabel')}
              placeholder={formsT('slugPlaceholder')}
              helperText={formsT('slugHelper')}
              fullWidth
            />
          </Stack>
        </Section>

        <Divider sx={{ borderColor: alpha.graphite[6] }} />

        <Section step={3} title={t('sections.status.title')}>
          <Controller
            control={control}
            name="startAsTrial"
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                    inputRef={field.ref}
                  />
                }
                label={
                  <Box>
                    <Typography sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 700 }}>
                      {t('sections.status.trialLabel')}
                    </Typography>
                    <Typography sx={{ color: brand.neutral[500], fontSize: 12.5 }}>
                      {t('sections.status.trialHelper')}
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: 'flex-start', m: 0, gap: 1, '& .MuiSwitch-root': { mt: -0.5 } }}
              />
            )}
          />
        </Section>

        {createTenant.isError ? (
          <Box sx={{ px: sectionPx, pb: 2 }}>
            <Alert severity="error">
              {extractErrorMessage(createTenant.error, t('createError'))}
            </Alert>
          </Box>
        ) : null}

        <Stack
          direction={{ xs: 'column-reverse', sm: 'row' }}
          justifyContent="flex-end"
          spacing={1.2}
          sx={{
            px: sectionPx,
            py: 2,
            borderTop: '1px solid',
            borderColor: alpha.graphite[6],
            bgcolor: surface.app,
          }}
        >
          <Button component={Link} href="/platform/tenants" variant="outlined" color="secondary">
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={
              isSubmitting ? <CircularProgress size={16} color="inherit" /> : <AddRoundedIcon />
            }
          >
            {t('submit')}
          </Button>
        </Stack>
      </Card>

      <CreateTenantSummary
        name={name}
        slug={slug}
        accountType={accountType}
        status={startAsTrial ? 'TRIAL' : 'ACTIVE'}
        plan={planOf(accountType)}
      />
    </Box>
  )
}

function Section({
  step,
  title,
  description,
  children,
}: {
  step: number
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Box component="section" sx={{ px: sectionPx, py: { xs: 2.2, md: 2.6 } }}>
      <Stack direction="row" spacing={1.2} alignItems="flex-start" sx={{ mb: 2 }}>
        <Box
          aria-hidden
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 24,
            height: 24,
            flexShrink: 0,
            borderRadius: radius.full,
            bgcolor: alpha.magenta[10],
            color: brand.magenta[500],
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {step}
        </Box>
        <Box>
          <Typography
            component="h2"
            sx={{ color: brand.graphite[500], fontSize: 16, fontWeight: 900 }}
          >
            {title}
          </Typography>
          {description ? (
            <Typography sx={{ color: brand.neutral[500], fontSize: 13 }}>{description}</Typography>
          ) : null}
        </Box>
      </Stack>
      {children}
    </Box>
  )
}

function AccountTypeOption({
  name,
  value,
  selected,
  onSelect,
  label,
  plan,
  price,
  includes,
}: {
  name: string
  value: string
  selected: boolean
  onSelect: () => void
  label: string
  plan: ApiPlatformPlan | undefined
  price: (plan: ApiPlatformPlan) => string
  includes: (plan: ApiPlatformPlan) => string
}) {
  const Icon = accountTypeIcons[value as keyof typeof accountTypeIcons]

  return (
    <Box
      component="label"
      sx={{
        position: 'relative',
        display: 'block',
        cursor: 'pointer',
        p: 1.6,
        borderRadius: `${radius.sm}px`,
        border: '1.5px solid',
        borderColor: selected ? brand.magenta[500] : alpha.graphite[10],
        bgcolor: selected ? alpha.magenta[6] : surface.paper,
        transition: 'border-color 140ms ease, background-color 140ms ease',
        '&:hover': { borderColor: selected ? brand.magenta[500] : alpha.magenta[36] },
        '&:has(input:focus-visible)': {
          outline: `2px solid ${brand.magenta[500]}`,
          outlineOffset: 2,
        },
      }}
    >
      <Box
        component="input"
        type="radio"
        name={name}
        value={value}
        checked={selected}
        onChange={onSelect}
        sx={visuallyHiddenSx}
      />
      {selected ? (
        <CheckCircleRoundedIcon
          aria-hidden
          sx={{ position: 'absolute', top: 12, right: 12, color: brand.magenta[500], fontSize: 20 }}
        />
      ) : null}
      <Box
        aria-hidden
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: 36,
          height: 36,
          mb: 1.2,
          borderRadius: `${radius.sm}px`,
          bgcolor: selected ? alpha.magenta[10] : brand.neutral[100],
          color: selected ? brand.magenta[500] : brand.graphite[500],
        }}
      >
        <Icon sx={{ fontSize: iconSize.lg }} />
      </Box>
      <Typography sx={{ color: brand.graphite[500], fontSize: 14.5, fontWeight: 800 }}>
        {label}
      </Typography>
      {plan ? (
        <>
          <Typography sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 700, mt: 0.4 }}>
            {price(plan)}
          </Typography>
          <Typography sx={{ color: brand.neutral[500], fontSize: 12 }}>{includes(plan)}</Typography>
        </>
      ) : null}
    </Box>
  )
}

const sectionPx = { xs: 2, md: 2.8 }

const cardSx = {
  bgcolor: surface.paper,
  borderColor: alpha.graphite[6],
  borderRadius: `${radius.sm}px`,
  boxShadow: shadows.propertyCard,
  overflow: 'hidden',
}

const visuallyHiddenSx = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  border: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  opacity: 0,
} as const

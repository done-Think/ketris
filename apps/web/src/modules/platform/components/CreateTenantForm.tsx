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
  TextField,
  Typography,
} from '@mui/material'
import { useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSnackbar } from 'notistack'
import { useFormatter, useTranslations } from 'next-intl'

import { Link, useRouter } from '@/i18n/navigation'
import { RhfTextField } from '@shared/components/form'
import { extractErrorMessage } from '@shared/utils/error-message'

import { usePlatformActor } from '../hooks/use-platform-actor'
import { useCreateTenant } from '../hooks/use-tenants'
import { usePlatformPlans } from '../hooks/use-platform-billing'
import { createTenantSchema } from '../schemas/create-tenant-schema'
import type { ApiPlatformPlan } from '../types/platform-plan'
import { TENANT_ACCOUNT_TYPES, type CreateTenantFormValues } from '../types/tenant'
import { accountTypeIcons } from '../utils/account-type-icons'
import { slugifyTenantName } from '../utils/tenant-slug'
import { CreateTenantSummary } from './CreateTenantSummary'
import { styles, getBoxStyles3, getBoxStyles4 } from '../styles/create-tenant-form.styles'

export function CreateTenantForm() {
  const t = useTranslations('platform.createAccount')
  const { canManage } = usePlatformActor()

  if (!canManage) return <Alert severity="info">{t('forbidden')}</Alert>

  return <CreateTenantFormContent />
}

function CreateTenantFormContent() {
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
  const {
    control,
    getFieldState,
    getValues,
    handleSubmit,
    setValue,
    formState: { isSubmitting, isSubmitted },
  } = useForm<CreateTenantFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', slug: '', accountType: 'AGENCY', startAsTrial: false },
  })
  const [name, slug, accountType, startAsTrial] = useWatch({
    control,
    name: ['name', 'slug', 'accountType', 'startAsTrial'],
  })

  function suggestSlug(nextName: string) {
    const slugEditedByHand = getFieldState('slug').isDirty && Boolean(getValues('slug'))
    if (!slugEditedByHand)
      setValue('slug', slugifyTenantName(nextName), { shouldValidate: isSubmitted })
  }
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
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={styles.box}>
      <Card variant="outlined" sx={styles.card}>
        <Section
          step={1}
          title={t('sections.accountType.title')}
          description={t('sections.accountType.description')}
        >
          <Controller
            control={control}
            name="accountType"
            render={({ field }) => (
              <Box role="radiogroup" aria-label={t('sections.accountType.title')} sx={styles.box2}>
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

        <Divider sx={styles.divider} />

        <Section
          step={2}
          title={t('sections.identity.title')}
          description={t('sections.identity.description')}
        >
          <Stack spacing={2.2}>
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  onChange={(event) => {
                    field.onChange(event)
                    suggestSlug(event.target.value)
                  }}
                  label={formsT('name')}
                  placeholder={formsT('namePlaceholder')}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  fullWidth
                  autoFocus
                />
              )}
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

        <Divider sx={styles.divider} />

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
                    <Typography sx={styles.typography}>
                      {t('sections.status.trialLabel')}
                    </Typography>
                    <Typography sx={styles.typography2}>
                      {t('sections.status.trialHelper')}
                    </Typography>
                  </Box>
                }
                sx={styles.formControlLabel}
              />
            )}
          />
        </Section>

        {createTenant.isError ? (
          <Box sx={styles.formBody}>
            <Alert severity="error">
              {extractErrorMessage(createTenant.error, t('createError'))}
            </Alert>
          </Box>
        ) : null}

        <Stack
          direction={{ xs: 'column-reverse', sm: 'row' }}
          justifyContent="flex-end"
          spacing={1.2}
          sx={styles.formActions}
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
    <Box component="section" sx={styles.section}>
      <Stack direction="row" spacing={1.2} alignItems="flex-start" sx={styles.stack}>
        <Box aria-hidden sx={styles.box3}>
          {step}
        </Box>
        <Box>
          <Typography component="h2" sx={styles.typography3}>
            {title}
          </Typography>
          {description ? <Typography sx={styles.typography4}>{description}</Typography> : null}
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
    <Box component="label" sx={getBoxStyles3({ selected })}>
      <Box
        component="input"
        type="radio"
        name={name}
        value={value}
        checked={selected}
        onChange={onSelect}
        sx={styles.visuallyHidden}
      />
      {selected ? <CheckCircleRoundedIcon aria-hidden sx={styles.checkCircleRoundedIcon} /> : null}
      <Box aria-hidden sx={getBoxStyles4({ selected })}>
        <Icon sx={styles.icon} />
      </Box>
      <Typography sx={styles.typography5}>{label}</Typography>
      {plan ? (
        <>
          <Typography sx={styles.typography6}>{price(plan)}</Typography>
          <Typography sx={styles.typography7}>{includes(plan)}</Typography>
        </>
      ) : null}
    </Box>
  )
}

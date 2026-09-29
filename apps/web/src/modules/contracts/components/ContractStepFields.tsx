import AddRoundedIcon from '@mui/icons-material/AddRounded'
import {
  Autocomplete,
  Box,
  Button,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'

import { RhfMaskedTextField, RhfTextField } from '@shared/components/form'
import { formatCurrency } from '@shared/lib/utils/format'
import { alpha, brand, radius } from '@shared/theme/tokens'

import { useCrmProperties, useOpportunities } from '@modules/crm/hooks/use-opportunities'

import { useContracts } from '../hooks/use-contracts'
import type {
  ContractFieldConfig,
  ContractFieldGridProps,
  ContractFieldMeta,
  ContractFieldProps,
  ContractOpportunityStepProps,
  ContractPartiesStepProps,
  ContractReviewItemProps,
  ContractReviewPanelProps,
  ContractSectionTitleProps,
  ContractStepControlProps,
  ContractStepFieldsProps,
  ContractStepReviewProps,
  EligibleContractOpportunity,
} from '../types/contract'
import { contractTextFieldSx } from './contract-form.styles'

const contractTypeOptions = ['RESIDENCIAL', 'COMERCIAL', 'TEMPORADA']
const guaranteeTypeOptions = ['FIADOR', 'CAUCAO', 'SEGURO_FIANCA', 'TITULO_CAPITALIZACAO']
const adjustmentIndexOptions = ['IPCA', 'IGPM', 'INPC']

function toFieldConfig(
  meta: ContractFieldMeta,
  t: (key: string) => string,
  multiline?: boolean,
): ContractFieldConfig {
  return {
    name: meta.name,
    label: t(`fields.${meta.labelKey}`),
    mask: meta.mask,
    options: meta.options,
    getOptionLabel: meta.optionsNamespace
      ? (option) => t(`${meta.optionsNamespace}.${option}`)
      : undefined,
    multiline,
  }
}

function makePartyFieldsMeta(prefix: 'owner' | 'tenant' | 'guarantor'): ContractFieldMeta[] {
  return [
    { name: `${prefix}Name`, labelKey: 'fullName' },
    { name: `${prefix}Cpf`, labelKey: 'cpf', mask: '000.000.000-00' },
    { name: `${prefix}Email`, labelKey: 'email' },
    { name: `${prefix}Phone`, labelKey: 'phone', mask: '(00) 00000-0000' },
  ]
}

export const partiesStepFieldNames = [
  ...makePartyFieldsMeta('owner').map((field) => field.name),
  ...makePartyFieldsMeta('tenant').map((field) => field.name),
  'hasGuarantor' as const,
  ...makePartyFieldsMeta('guarantor').map((field) => field.name),
]

export const opportunityStepFieldNames = ['opportunityId' as const]

const conditionsStepFieldsMeta: ContractFieldMeta[] = [
  {
    name: 'contractType',
    labelKey: 'contractType',
    options: contractTypeOptions,
    optionsNamespace: 'contractTypeOptions',
  },
  { name: 'dueDay', labelKey: 'dueDay', mask: '00' },
  {
    name: 'guaranteeType',
    labelKey: 'guaranteeType',
    options: guaranteeTypeOptions,
    optionsNamespace: 'guaranteeTypeOptions',
  },
  { name: 'startDate', labelKey: 'startDate', mask: '00/00/0000' },
  { name: 'endDate', labelKey: 'endDate', mask: '00/00/0000' },
  {
    name: 'adjustmentIndex',
    labelKey: 'adjustmentIndex',
    options: adjustmentIndexOptions,
    optionsNamespace: 'adjustmentIndexOptions',
  },
]

export const conditionsStepFieldNames = [
  ...conditionsStepFieldsMeta.map((field) => field.name),
  'notes' as const,
]

function SectionTitle({ children }: ContractSectionTitleProps) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 1.7 }}>
      <Box
        aria-hidden
        sx={{
          width: 5,
          height: 20,
          borderRadius: radius.full,
          bgcolor: brand.magenta[500],
          flexShrink: 0,
        }}
      />
      <Typography sx={{ color: brand.graphite[500], fontSize: 16, fontWeight: 900 }}>
        {children}
      </Typography>
    </Stack>
  )
}

function ContractField({ control, field }: ContractFieldProps) {
  if (field.options) {
    return (
      <RhfTextField
        control={control}
        name={field.name}
        label={field.label}
        select
        fullWidth
        InputLabelProps={{ shrink: true }}
        sx={contractTextFieldSx}
      >
        {field.options.map((option) => (
          <MenuItem key={option} value={option}>
            {field.getOptionLabel ? field.getOptionLabel(option) : option}
          </MenuItem>
        ))}
      </RhfTextField>
    )
  }

  if (field.mask) {
    return (
      <RhfMaskedTextField
        control={control}
        name={field.name}
        label={field.label}
        mask={field.mask}
        fullWidth
        InputLabelProps={{ shrink: true }}
        sx={contractTextFieldSx}
      />
    )
  }

  return (
    <RhfTextField
      control={control}
      name={field.name}
      label={field.label}
      fullWidth
      multiline={field.multiline}
      minRows={field.multiline ? 3 : undefined}
      InputLabelProps={{ shrink: true }}
      sx={contractTextFieldSx}
    />
  )
}

function FieldGrid({ control, fields }: ContractFieldGridProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        gap: { xs: 1.8, md: 2.2, xl: 2.6 },
      }}
    >
      {fields.map((field) => (
        <ContractField key={field.name} control={control} field={field} />
      ))}
    </Box>
  )
}

function PartiesStep({ control, setValue, values }: ContractPartiesStepProps) {
  const t = useTranslations('contracts.wizard.parties')

  const ownerFields = makePartyFieldsMeta('owner').map((field) => toFieldConfig(field, t))
  const tenantFields = makePartyFieldsMeta('tenant').map((field) => toFieldConfig(field, t))
  const guarantorFields = makePartyFieldsMeta('guarantor').map((field) => toFieldConfig(field, t))
  // Either signal reveals the section: the explicit flag, or "FIADOR" picked directly as the
  // guarantee type in the Conditions step — kept in sync with the schema's superRefine trigger.
  const hasActiveGuarantor = values.hasGuarantor || values.guaranteeType === 'FIADOR'

  const addGuarantor = () => {
    setValue('hasGuarantor', true, { shouldDirty: true })
    setValue('guaranteeType', 'FIADOR', { shouldDirty: true })
  }

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr auto 1fr' },
          gap: { xs: 3.2, lg: 6.5, xl: 9 },
          alignItems: 'start',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <SectionTitle>{t('ownerTitle')}</SectionTitle>
          <FieldGrid control={control} fields={ownerFields} />
        </Box>
        <Divider
          orientation="vertical"
          flexItem
          sx={{
            display: { xs: 'none', lg: 'block' },
            borderColor: alpha.graphite[10],
            minHeight: 120,
            mt: 2.2,
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <SectionTitle>{t('tenantTitle')}</SectionTitle>
          <FieldGrid control={control} fields={tenantFields} />
        </Box>
      </Box>

      {hasActiveGuarantor ? (
        <Box sx={{ mt: 3.2 }}>
          <SectionTitle>{t('guarantorTitle')}</SectionTitle>
          <FieldGrid control={control} fields={guarantorFields} />
        </Box>
      ) : (
        <Button
          type="button"
          startIcon={<AddRoundedIcon />}
          onClick={addGuarantor}
          sx={{
            mt: 3.2,
            px: 0,
            color: brand.magenta[500],
            fontSize: 13,
            fontWeight: 900,
            textTransform: 'none',
            '&:hover': { bgcolor: 'transparent', color: brand.magenta[700] },
          }}
        >
          {t('addGuarantor')}
        </Button>
      )}
    </>
  )
}

function formatPropertyAddress(property: { neighborhood: string | null; city: string | null }) {
  return [property.neighborhood, property.city].filter(Boolean).join(', ')
}

function OpportunityStep({ control, setValue, values }: ContractOpportunityStepProps) {
  const t = useTranslations('contracts.wizard.opportunity')
  const { data: session } = useSession()
  const tenantId = session?.tenantId ?? ''

  const acceptedOpportunitiesQuery = useOpportunities(tenantId, { status: 'ACEITA' })
  const contractsQuery = useContracts(tenantId)
  const propertiesQuery = useCrmProperties(tenantId)

  const contractedOpportunityIds = new Set(
    (contractsQuery.data?.items ?? []).map((item) => item.opportunityId),
  )
  const propertiesById = new Map(
    (propertiesQuery.data ?? []).map((property) => [property.id, property]),
  )

  const eligibleOpportunities: EligibleContractOpportunity[] = (
    acceptedOpportunitiesQuery.data ?? []
  )
    .filter((opportunity) => !contractedOpportunityIds.has(opportunity.id))
    .map((opportunity) => {
      const property = propertiesById.get(opportunity.propertyId)

      return {
        id: opportunity.id,
        leadName: opportunity.leadName,
        leadEmail: opportunity.leadEmail,
        leadPhone: opportunity.leadPhone,
        propertyId: opportunity.propertyId,
        propertyTitle: property?.title ?? opportunity.propertyId,
        propertyAddress: property ? formatPropertyAddress(property) : '',
        amountLabel: formatCurrency(opportunity.proposedValue),
      }
    })

  const selectedOpportunity =
    eligibleOpportunities.find((opportunity) => opportunity.id === values.opportunityId) ?? null

  const applyOpportunity = (opportunity: EligibleContractOpportunity | null) => {
    setValue('opportunityId', opportunity?.id ?? '', { shouldDirty: true })

    if (opportunity) {
      setValue('tenantName', opportunity.leadName, { shouldDirty: true })
      setValue('tenantEmail', opportunity.leadEmail, { shouldDirty: true })
      if (opportunity.leadPhone) {
        setValue('tenantPhone', opportunity.leadPhone, { shouldDirty: true })
      }
    }
  }

  const isLoading =
    acceptedOpportunitiesQuery.isLoading || contractsQuery.isLoading || propertiesQuery.isLoading

  return (
    <Stack spacing={3}>
      <Box>
        <SectionTitle>{t('title')}</SectionTitle>
        <Controller
          control={control}
          name="opportunityId"
          render={({ field, fieldState }) => (
            <Autocomplete
              options={eligibleOpportunities}
              getOptionLabel={(opportunity) =>
                `${opportunity.leadName} — ${opportunity.propertyTitle}`
              }
              isOptionEqualToValue={(option, selected) => option.id === selected.id}
              value={selectedOpportunity}
              loading={isLoading}
              noOptionsText={t('picker.noOptions')}
              onChange={(_event, opportunity) => {
                field.onChange(opportunity?.id ?? '')
                applyOpportunity(opportunity)
              }}
              onBlur={field.onBlur}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('picker.label')}
                  helperText={fieldState.error?.message ?? t('picker.helperText')}
                  error={Boolean(fieldState.error)}
                  InputLabelProps={{ shrink: true }}
                  sx={contractTextFieldSx}
                />
              )}
            />
          )}
        />

        {selectedOpportunity ? (
          <Box
            sx={{
              mt: 2.4,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              gap: 1.8,
              border: '1px solid',
              borderColor: alpha.graphite[8],
              borderRadius: `${radius.sm}px`,
              p: { xs: 2, md: 2.4 },
            }}
          >
            <ReviewItem label={t('summary.property')} value={selectedOpportunity.propertyTitle} />
            <ReviewItem label={t('summary.address')} value={selectedOpportunity.propertyAddress} />
            <ReviewItem label={t('summary.lead')} value={selectedOpportunity.leadName} />
            <ReviewItem label={t('summary.amount')} value={selectedOpportunity.amountLabel} />
          </Box>
        ) : null}
      </Box>
    </Stack>
  )
}

function ConditionsStep({ control }: ContractStepControlProps) {
  const t = useTranslations('contracts.wizard.conditions')

  return (
    <Stack spacing={3}>
      <Box>
        <SectionTitle>{t('title')}</SectionTitle>
        <FieldGrid
          control={control}
          fields={[
            ...conditionsStepFieldsMeta.map((field) => toFieldConfig(field, t)),
            toFieldConfig({ name: 'notes', labelKey: 'notes' }, t, true),
          ]}
        />
      </Box>
    </Stack>
  )
}

function ReviewItem({ label, value }: ContractReviewItemProps) {
  return (
    <Box>
      <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 900 }}>
        {value || '-'}
      </Typography>
    </Box>
  )
}

function ReviewPanel({ title, items }: ContractReviewPanelProps) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: alpha.graphite[8],
        borderRadius: `${radius.sm}px`,
        p: { xs: 2, md: 2.4 },
      }}
    >
      <SectionTitle>{title}</SectionTitle>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          gap: 1.8,
        }}
      >
        {items.map((item) => (
          <ReviewItem key={`${title}-${item.label}`} {...item} />
        ))}
      </Box>
    </Box>
  )
}

function ReviewStep({ values }: ContractStepReviewProps) {
  const t = useTranslations('contracts.wizard.review')
  const tConditions = useTranslations('contracts.wizard.conditions')
  const hasActiveGuarantor = values.hasGuarantor || values.guaranteeType === 'FIADOR'

  const partiesItems = [
    { label: t('labels.owner'), value: values.ownerName },
    { label: t('labels.ownerCpf'), value: values.ownerCpf },
    { label: t('labels.tenant'), value: values.tenantName },
    { label: t('labels.tenantCpf'), value: values.tenantCpf },
    ...(hasActiveGuarantor
      ? [
          { label: t('labels.guarantor'), value: values.guarantorName },
          { label: t('labels.guarantorCpf'), value: values.guarantorCpf },
        ]
      : []),
  ]

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
        gap: { xs: 2, md: 2.4 },
      }}
    >
      <ReviewPanel title={t('partiesTitle')} items={partiesItems} />
      <ReviewPanel
        title={t('conditionsTitle')}
        items={[
          {
            label: t('labels.contract'),
            value: tConditions(`contractTypeOptions.${values.contractType}`),
          },
          {
            label: t('labels.dueDay'),
            value: t('labels.dueDayValue', { day: values.dueDay }),
          },
          {
            label: t('labels.guarantee'),
            value: tConditions(`guaranteeTypeOptions.${values.guaranteeType}`),
          },
        ]}
      />
      <ReviewPanel
        title={t('termTitle')}
        items={[
          { label: t('labels.start'), value: values.startDate },
          { label: t('labels.end'), value: values.endDate },
          {
            label: t('labels.adjustment'),
            value: tConditions(`adjustmentIndexOptions.${values.adjustmentIndex}`),
          },
          { label: t('labels.notes'), value: values.notes },
        ]}
      />
    </Box>
  )
}

export function ContractStepFields({
  activeStepKey,
  control,
  setValue,
  values,
}: ContractStepFieldsProps) {
  if (activeStepKey === 'opportunity') {
    return <OpportunityStep control={control} setValue={setValue} values={values} />
  }
  if (activeStepKey === 'conditions') return <ConditionsStep control={control} />
  if (activeStepKey === 'review') return <ReviewStep values={values} />

  return <PartiesStep control={control} setValue={setValue} values={values} />
}

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { Box, Button, Divider, MenuItem, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { RhfMaskedTextField, RhfTextField } from '@shared/components/form'
import { alpha, brand, radius } from '@shared/theme/tokens'

import type {
  ContractFieldConfig,
  ContractFieldGridProps,
  ContractFieldProps,
  ContractPartiesStepProps,
  ContractReviewItemProps,
  ContractReviewPanelProps,
  ContractSectionTitleProps,
  ContractStepControlProps,
  ContractStepFieldsProps,
  ContractStepReviewProps,
} from '../types/contract'
import { contractTextFieldSx } from './contract-form.styles'

const propertyTypeOptions = ['Apartamento', 'Casa', 'Studio', 'Cobertura', 'Sala comercial']
const contractTypeOptions = ['Locação residencial', 'Locação comercial', 'Temporada']
const guaranteeTypeOptions = ['Fiador', 'Caução', 'Seguro fiança', 'Título de capitalização']
const adjustmentIndexOptions = ['IPCA', 'IGP-M', 'INPC']

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

  const ownerFields: ContractFieldConfig[] = [
    { name: 'ownerName', label: t('fields.fullName') },
    { name: 'ownerCpf', label: t('fields.cpf'), mask: '000.000.000-00' },
    { name: 'ownerEmail', label: t('fields.email') },
    { name: 'ownerPhone', label: t('fields.phone'), mask: '(00) 00000-0000' },
  ]

  const tenantFields: ContractFieldConfig[] = [
    { name: 'tenantName', label: t('fields.fullName') },
    { name: 'tenantCpf', label: t('fields.cpf'), mask: '000.000.000-00' },
    { name: 'tenantEmail', label: t('fields.email') },
    { name: 'tenantPhone', label: t('fields.phone'), mask: '(00) 00000-0000' },
  ]

  const guarantorFields: ContractFieldConfig[] = [
    { name: 'guarantorName', label: t('fields.fullName') },
    { name: 'guarantorCpf', label: t('fields.cpf'), mask: '000.000.000-00' },
    { name: 'guarantorEmail', label: t('fields.email') },
    { name: 'guarantorPhone', label: t('fields.phone'), mask: '(00) 00000-0000' },
  ]

  const addGuarantor = () => {
    setValue('hasGuarantor', true, { shouldDirty: true })
    setValue('guaranteeType', 'Fiador', { shouldDirty: true })
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

      {values.hasGuarantor ? (
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

function PropertyStep({ control }: ContractStepControlProps) {
  const t = useTranslations('contracts.wizard.property')

  return (
    <Stack spacing={3}>
      <Box>
        <SectionTitle>{t('title')}</SectionTitle>
        <FieldGrid
          control={control}
          fields={[
            { name: 'propertyTitle', label: t('fields.propertyTitle') },
            {
              name: 'propertyType',
              label: t('fields.propertyType'),
              options: propertyTypeOptions,
              getOptionLabel: (option) => t(`typeOptions.${option}`),
            },
            { name: 'propertyAddress', label: t('fields.propertyAddress') },
            { name: 'propertyZipCode', label: t('fields.propertyZipCode'), mask: '00000-000' },
            { name: 'propertyCity', label: t('fields.propertyCity') },
            { name: 'propertyState', label: t('fields.propertyState'), mask: 'aa' },
            { name: 'propertyRegistration', label: t('fields.propertyRegistration') },
            { name: 'propertyArea', label: t('fields.propertyArea') },
          ]}
        />
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
            {
              name: 'contractType',
              label: t('fields.contractType'),
              options: contractTypeOptions,
              getOptionLabel: (option) => t(`contractTypeOptions.${option}`),
            },
            { name: 'monthlyRent', label: t('fields.monthlyRent') },
            { name: 'condominiumFee', label: t('fields.condominiumFee') },
            { name: 'iptu', label: t('fields.iptu') },
            { name: 'dueDay', label: t('fields.dueDay'), mask: '00' },
            {
              name: 'guaranteeType',
              label: t('fields.guaranteeType'),
              options: guaranteeTypeOptions,
              getOptionLabel: (option) => t(`guaranteeTypeOptions.${option}`),
            },
            { name: 'startDate', label: t('fields.startDate'), mask: '00/00/0000' },
            { name: 'endDate', label: t('fields.endDate'), mask: '00/00/0000' },
            {
              name: 'adjustmentIndex',
              label: t('fields.adjustmentIndex'),
              options: adjustmentIndexOptions,
              getOptionLabel: (option) => t(`adjustmentIndexOptions.${option}`),
            },
            { name: 'notes', label: t('fields.notes'), multiline: true },
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

  const partiesItems = [
    { label: t('labels.owner'), value: values.ownerName },
    { label: t('labels.ownerCpf'), value: values.ownerCpf },
    { label: t('labels.tenant'), value: values.tenantName },
    { label: t('labels.tenantCpf'), value: values.tenantCpf },
    ...(values.hasGuarantor
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
        title={t('propertyTitle')}
        items={[
          { label: t('labels.property'), value: values.propertyTitle },
          { label: t('labels.type'), value: values.propertyType },
          { label: t('labels.address'), value: values.propertyAddress },
          { label: t('labels.cityState'), value: `${values.propertyCity}/${values.propertyState}` },
        ]}
      />
      <ReviewPanel
        title={t('conditionsTitle')}
        items={[
          { label: t('labels.contract'), value: values.contractType },
          { label: t('labels.rent'), value: values.monthlyRent },
          { label: t('labels.dueDay'), value: t('labels.dueDayValue', { day: values.dueDay }) },
          { label: t('labels.guarantee'), value: values.guaranteeType },
        ]}
      />
      <ReviewPanel
        title={t('termTitle')}
        items={[
          { label: t('labels.start'), value: values.startDate },
          { label: t('labels.end'), value: values.endDate },
          { label: t('labels.adjustment'), value: values.adjustmentIndex },
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
  if (activeStepKey === 'property') return <PropertyStep control={control} />
  if (activeStepKey === 'conditions') return <ConditionsStep control={control} />
  if (activeStepKey === 'review') return <ReviewStep values={values} />

  return <PartiesStep control={control} setValue={setValue} values={values} />
}

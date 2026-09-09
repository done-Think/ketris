import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { Box, Button, Divider, MenuItem, Stack, Typography } from '@mui/material'

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
            {option}
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
  const ownerFields: ContractFieldConfig[] = [
    { name: 'ownerName', label: 'Nome completo' },
    { name: 'ownerCpf', label: 'CPF', mask: '000.000.000-00' },
    { name: 'ownerEmail', label: 'E-mail' },
    { name: 'ownerPhone', label: 'Telefone', mask: '(00) 00000-0000' },
  ]

  const tenantFields: ContractFieldConfig[] = [
    { name: 'tenantName', label: 'Nome completo' },
    { name: 'tenantCpf', label: 'CPF', mask: '000.000.000-00' },
    { name: 'tenantEmail', label: 'E-mail' },
    { name: 'tenantPhone', label: 'Telefone', mask: '(00) 00000-0000' },
  ]

  const guarantorFields: ContractFieldConfig[] = [
    { name: 'guarantorName', label: 'Nome completo' },
    { name: 'guarantorCpf', label: 'CPF', mask: '000.000.000-00' },
    { name: 'guarantorEmail', label: 'E-mail' },
    { name: 'guarantorPhone', label: 'Telefone', mask: '(00) 00000-0000' },
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
          <SectionTitle>Locador (Proprietário)</SectionTitle>
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
          <SectionTitle>Locatário</SectionTitle>
          <FieldGrid control={control} fields={tenantFields} />
        </Box>
      </Box>

      {values.hasGuarantor ? (
        <Box sx={{ mt: 3.2 }}>
          <SectionTitle>Fiador</SectionTitle>
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
          Adicionar fiador
        </Button>
      )}
    </>
  )
}

function PropertyStep({ control }: ContractStepControlProps) {
  return (
    <Stack spacing={3}>
      <Box>
        <SectionTitle>Dados do imóvel</SectionTitle>
        <FieldGrid
          control={control}
          fields={[
            { name: 'propertyTitle', label: 'Imóvel' },
            { name: 'propertyType', label: 'Tipo', options: propertyTypeOptions },
            { name: 'propertyAddress', label: 'Endereço' },
            { name: 'propertyZipCode', label: 'CEP', mask: '00000-000' },
            { name: 'propertyCity', label: 'Cidade' },
            { name: 'propertyState', label: 'UF', mask: 'aa' },
            { name: 'propertyRegistration', label: 'Matrícula' },
            { name: 'propertyArea', label: 'Área útil' },
          ]}
        />
      </Box>
    </Stack>
  )
}

function ConditionsStep({ control }: ContractStepControlProps) {
  return (
    <Stack spacing={3}>
      <Box>
        <SectionTitle>Condições comerciais</SectionTitle>
        <FieldGrid
          control={control}
          fields={[
            { name: 'contractType', label: 'Tipo de contrato', options: contractTypeOptions },
            { name: 'monthlyRent', label: 'Valor do aluguel' },
            { name: 'condominiumFee', label: 'Condomínio' },
            { name: 'iptu', label: 'IPTU' },
            { name: 'dueDay', label: 'Vencimento', mask: '00' },
            { name: 'guaranteeType', label: 'Garantia', options: guaranteeTypeOptions },
            { name: 'startDate', label: 'Início', mask: '00/00/0000' },
            { name: 'endDate', label: 'Término', mask: '00/00/0000' },
            { name: 'adjustmentIndex', label: 'Reajuste', options: adjustmentIndexOptions },
            { name: 'notes', label: 'Observações', multiline: true },
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
  const partiesItems = [
    { label: 'Locador', value: values.ownerName },
    { label: 'CPF do locador', value: values.ownerCpf },
    { label: 'Locatário', value: values.tenantName },
    { label: 'CPF do locatário', value: values.tenantCpf },
    ...(values.hasGuarantor
      ? [
          { label: 'Fiador', value: values.guarantorName },
          { label: 'CPF do fiador', value: values.guarantorCpf },
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
      <ReviewPanel title="Partes" items={partiesItems} />
      <ReviewPanel
        title="Imóvel"
        items={[
          { label: 'Imóvel', value: values.propertyTitle },
          { label: 'Tipo', value: values.propertyType },
          { label: 'Endereço', value: values.propertyAddress },
          { label: 'Cidade/UF', value: `${values.propertyCity}/${values.propertyState}` },
        ]}
      />
      <ReviewPanel
        title="Condições"
        items={[
          { label: 'Contrato', value: values.contractType },
          { label: 'Aluguel', value: values.monthlyRent },
          { label: 'Vencimento', value: `Dia ${values.dueDay}` },
          { label: 'Garantia', value: values.guaranteeType },
        ]}
      />
      <ReviewPanel
        title="Vigência"
        items={[
          { label: 'Início', value: values.startDate },
          { label: 'Término', value: values.endDate },
          { label: 'Reajuste', value: values.adjustmentIndex },
          { label: 'Observações', value: values.notes },
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

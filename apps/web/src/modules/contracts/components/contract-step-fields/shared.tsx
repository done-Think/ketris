import { Box, MenuItem, Stack, Typography } from '@mui/material'

import { RhfMaskedTextField, RhfTextField } from '@shared/components/form'
import { brand, radius } from '@shared/theme/tokens'

import type {
  ContractFieldConfig,
  ContractFieldGridProps,
  ContractFieldMeta,
  ContractFieldProps,
  ContractSectionTitleProps,
} from '../../types/contract'
import { contractTextFieldSx } from '../contract-form.styles'

export const contractTypeOptions = ['RESIDENCIAL', 'COMERCIAL', 'TEMPORADA']
export const guaranteeTypeOptions = ['FIADOR', 'CAUCAO', 'SEGURO_FIANCA', 'TITULO_CAPITALIZACAO']
export const adjustmentIndexOptions = ['IPCA', 'IGPM', 'INPC']

export const conditionsStepFieldsMeta: ContractFieldMeta[] = [
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

export function toFieldConfig(
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

export function makePartyFieldsMeta(prefix: 'owner' | 'tenant' | 'guarantor'): ContractFieldMeta[] {
  return [
    { name: `${prefix}Name`, labelKey: 'fullName' },
    { name: `${prefix}Cpf`, labelKey: 'cpf', mask: '000.000.000-00' },
    { name: `${prefix}Email`, labelKey: 'email' },
    { name: `${prefix}Phone`, labelKey: 'phone', mask: '(00) 00000-0000' },
  ]
}

export function SectionTitle({ children }: ContractSectionTitleProps) {
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

export function ContractField({ control, field }: ContractFieldProps) {
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

export function FieldGrid({ control, fields }: ContractFieldGridProps) {
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

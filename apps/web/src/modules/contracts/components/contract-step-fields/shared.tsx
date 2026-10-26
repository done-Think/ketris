import { styles } from '../../styles/shared.styles'
import { Box, MenuItem, Stack, Typography } from '@mui/material'
import { RhfMaskedTextField, RhfTextField } from '@shared/components/form'
import type {
  ContractFieldGridProps,
  ContractFieldProps,
  ContractSectionTitleProps,
} from '../../types/contract'
import { contractTextFieldSx } from '../../styles/contract-form.styles'

export function SectionTitle({ children }: ContractSectionTitleProps) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.8} sx={styles.stack}>
      <Box aria-hidden sx={styles.box} />
      <Typography sx={styles.typography}>{children}</Typography>
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
    <Box sx={styles.box2}>
      {fields.map((field) => (
        <ContractField key={field.name} control={control} field={field} />
      ))}
    </Box>
  )
}

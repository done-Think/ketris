import { Chip } from '@mui/material'
import { alpha as muiAlpha } from '@mui/material/styles'

import { brand, radius } from '@shared/theme/tokens'

import type { ContactType, ContactTypeChipProps } from '../../types/contact'

const typePresentation: Record<
  ContactType,
  { label: string; color: string; backgroundColor: string }
> = {
  renter: {
    label: 'Locatário',
    color: brand.semantic.success,
    backgroundColor: muiAlpha(brand.semantic.success, 0.1),
  },
  owner: {
    label: 'Proprietário',
    color: brand.semantic.info,
    backgroundColor: muiAlpha(brand.semantic.info, 0.1),
  },
  broker: {
    label: 'Corretor',
    color: brand.magenta[500],
    backgroundColor: brand.magenta[50],
  },
}

export function ContactTypeChip({ type }: ContactTypeChipProps) {
  const presentation = typePresentation[type]

  return (
    <Chip
      label={presentation.label}
      size="small"
      sx={{
        height: 20,
        borderRadius: `${radius.full}px`,
        bgcolor: presentation.backgroundColor,
        color: presentation.color,
        fontSize: 10,
        fontWeight: 600,
        '& .MuiChip-label': { px: 1 },
      }}
    />
  )
}

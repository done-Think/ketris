import { Chip } from '@mui/material'
import { alpha as muiAlpha } from '@mui/material/styles'
import { useTranslations } from 'next-intl'

import { brand, radius } from '@shared/theme/tokens'

import type { ContactType, ContactTypeChipProps } from '../../types/contact'

const typePresentation: Record<ContactType, { color: string; backgroundColor: string }> = {
  Locatário: {
    color: brand.semantic.success,
    backgroundColor: muiAlpha(brand.semantic.success, 0.1),
  },
  Proprietário: {
    color: brand.semantic.info,
    backgroundColor: muiAlpha(brand.semantic.info, 0.1),
  },
  Corretor: {
    color: brand.magenta[500],
    backgroundColor: brand.magenta[50],
  },
}

const contactTypeLabelKeys: Record<ContactType, 'tenant' | 'owner' | 'broker'> = {
  Locatário: 'tenant',
  Proprietário: 'owner',
  Corretor: 'broker',
}

export function ContactTypeChip({ type }: ContactTypeChipProps) {
  const t = useTranslations('crm.contacts.types')
  const presentation = typePresentation[type]

  return (
    <Chip
      label={t(contactTypeLabelKeys[type])}
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

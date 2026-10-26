import { Chip } from '@mui/material'
import { useTranslations } from 'next-intl'
import * as crmStyles from '../../styles/contact-type-chip.styles'

import type { ContactTypeChipProps } from '../../types/contact'

export function ContactTypeChip({ type }: ContactTypeChipProps) {
  const t = useTranslations('crm.contacts.types')
  const presentation = crmStyles.typePresentation[type]

  return (
    <Chip
      label={t(crmStyles.contactTypeLabelKeys[type])}
      size="small"
      sx={crmStyles.getChipSx(presentation)}
    />
  )
}

import { styles } from '../../styles/parties-step.styles'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { Box, Button, Divider } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useWatch } from 'react-hook-form'
import type { ContractPartiesStepProps } from '../../types/contract'
import { FieldGrid, SectionTitle } from './shared'
import { makePartyFieldsMeta, toFieldConfig } from '../../utils/contract-fields'

export function PartiesStep({ control, setValue }: ContractPartiesStepProps) {
  const [hasGuarantor, guaranteeType] = useWatch({
    control,
    name: ['hasGuarantor', 'guaranteeType'],
  })
  const t = useTranslations('contracts.wizard.parties')

  const ownerFields = makePartyFieldsMeta('owner').map((field) => toFieldConfig(field, t))
  const tenantFields = makePartyFieldsMeta('tenant').map((field) => toFieldConfig(field, t))
  const guarantorFields = makePartyFieldsMeta('guarantor').map((field) => toFieldConfig(field, t))
  const hasActiveGuarantor = hasGuarantor || guaranteeType === 'GUARANTOR'

  const addGuarantor = () => {
    setValue('hasGuarantor', true, { shouldDirty: true })
    setValue('guaranteeType', 'GUARANTOR', { shouldDirty: true })
  }

  return (
    <>
      <Box sx={styles.box}>
        <Box sx={styles.box2}>
          <SectionTitle>{t('ownerTitle')}</SectionTitle>
          <FieldGrid control={control} fields={ownerFields} />
        </Box>
        <Divider orientation="vertical" flexItem sx={styles.divider} />
        <Box sx={styles.box3}>
          <SectionTitle>{t('tenantTitle')}</SectionTitle>
          <FieldGrid control={control} fields={tenantFields} />
        </Box>
      </Box>

      {hasActiveGuarantor ? (
        <Box sx={styles.box4}>
          <SectionTitle>{t('guarantorTitle')}</SectionTitle>
          <FieldGrid control={control} fields={guarantorFields} />
          <Button
            disabled={guaranteeType === 'GUARANTOR'}
            onClick={() => setValue('hasGuarantor', false, { shouldDirty: true })}
          >
            {t('removeGuarantor')}
          </Button>
        </Box>
      ) : (
        <Button
          type="button"
          startIcon={<AddRoundedIcon />}
          onClick={addGuarantor}
          sx={styles.button}
        >
          {t('addGuarantor')}
        </Button>
      )}
    </>
  )
}

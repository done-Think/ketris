import { styles } from '../styles/contracts-empty-state.styles'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import { Box, Button, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import type { ContractsEmptyStateProps } from '../types/contract'

export function ContractsEmptyState({ onCreateContract }: ContractsEmptyStateProps) {
  const t = useTranslations('contracts.emptyState')

  return (
    <Stack alignItems="center" justifyContent="center" spacing={1.6} sx={styles.stack}>
      <Box sx={styles.box}>
        <DescriptionOutlinedIcon sx={styles.descriptionOutlinedIcon} />
      </Box>
      <Box>
        <Typography sx={styles.typography}>{t('title')}</Typography>
        <Typography sx={styles.typography2}>{t('description')}</Typography>
      </Box>
      {onCreateContract ? (
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={onCreateContract}
          sx={styles.button}
        >
          {t('cta')}
        </Button>
      ) : null}
    </Stack>
  )
}

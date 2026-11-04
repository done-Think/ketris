'use client'

import { Alert, Avatar, Box, Button, Chip, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useContract } from '@/modules/contracts'
import { getInitials } from '@shared/utils/get-initials'
import { styles } from '../styles/property-detail-sidebar.styles'
import type { PropertyContractParticipantsProps } from '../types/dashboard-property'

const roleMessageKeys = {
  LANDLORD: 'participantRoles.landlord',
  RENTER: 'participantRoles.renter',
  GUARANTOR: 'participantRoles.guarantor',
} as const

export function PropertyContractParticipants({
  propertyId,
  contractId,
}: PropertyContractParticipantsProps) {
  const t = useTranslations('properties.detail')
  const query = useContract(contractId)

  if (query.isPending) {
    return (
      <Box role="status" sx={styles.box}>
        <Typography>{t('participantsLoading')}</Typography>
      </Box>
    )
  }

  if (query.isError) {
    return (
      <Box sx={styles.box}>
        <Typography sx={styles.typography}>{t('participantsTitle')}</Typography>
        <Alert severity="error">{t('participantsLoadError')}</Alert>
        <Button onClick={() => void query.refetch()} disabled={query.isFetching}>
          {t('retryParticipants')}
        </Button>
      </Box>
    )
  }

  const contract = query.data
  if (
    !contract ||
    contract.id !== contractId ||
    contract.propertyId !== propertyId ||
    contract.status !== 'ACTIVE' ||
    contract.parties.length === 0
  )
    return null

  return (
    <Box sx={styles.box}>
      <Typography sx={styles.typography}>{t('participantsTitle')}</Typography>
      <Stack spacing={2}>
        {contract.parties.map((party) => (
          <Stack key={party.id} direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={styles.avatar}>{getInitials(party.name)}</Avatar>
            <Box>
              <Typography sx={styles.typography2}>{party.name}</Typography>
              <Chip label={t(roleMessageKeys[party.role])} size="small" sx={styles.chip} />
            </Box>
          </Stack>
        ))}
      </Stack>
    </Box>
  )
}

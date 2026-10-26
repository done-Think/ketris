'use client'

import {
  contractPartyMessageKeys,
  contractSignatureMessageKeys,
} from '../../config/contract-labels'
import { styles } from '../../styles/contract-parties-panel.styles'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'
import type { ContractPartiesPanelProps } from '../../types/detail'
import { ContractDetailPanel } from './ContractDetailPanel'

export function ContractPartiesPanel({
  parties,
  isSigning,
  onSign,
  readOnly,
  canSign,
  canLink,
  onLink,
}: ContractPartiesPanelProps) {
  const t = useTranslations('contracts.detail')
  const formatter = useFormatter()
  return (
    <ContractDetailPanel title={t('parties')} sx={styles.contractDetailPanel}>
      <Stack spacing={1.6}>
        {parties.map((party) => {
          const isSigned = party.signatureStatus === 'ASSINADA'
          return (
            <Stack key={party.id} spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1.3} sx={styles.stack}>
                <Box sx={styles.box}>
                  <Typography noWrap sx={styles.typography}>
                    {party.name}
                  </Typography>
                  <Typography noWrap sx={styles.typography2}>
                    {t(contractPartyMessageKeys[party.role])}
                  </Typography>
                </Box>
                {isSigned ? (
                  <Chip
                    label={t(
                      party.signatureMethod
                        ? contractSignatureMessageKeys[party.signatureMethod]
                        : 'legacySignature',
                    )}
                    size="small"
                    sx={styles.chip}
                  />
                ) : (
                  !readOnly &&
                  canSign && (
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={isSigning}
                      onClick={() => onSign(party.id)}
                      sx={styles.button}
                    >
                      {t('sign')}
                    </Button>
                  )
                )}
              </Stack>
              {party.signedAt && (
                <Typography variant="body2">
                  {formatter.dateTime(new Date(party.signedAt), {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                  {party.signedBy ? ' · ' + party.signedBy.name : ''}
                </Typography>
              )}
              {party.role === 'LOCATARIO' &&
                (party.userId ? (
                  <Typography variant="body2">{t('linked')}</Typography>
                ) : (
                  canLink && (
                    <Button size="small" disabled={isSigning} onClick={() => onLink(party)}>
                      {t('link')}
                    </Button>
                  )
                ))}
            </Stack>
          )
        })}
      </Stack>
    </ContractDetailPanel>
  )
}

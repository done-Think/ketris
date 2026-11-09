'use client'

import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'
import { Box, Chip, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { maskCpf } from '../../../utils/cpf'

import type { CheckRowProps, SessionCardProps } from '../../../types/console.types'
import { cardStyles, detailStyles as styles } from '../../../styles/console.styles'

function CheckRow({ label, detail, result }: CheckRowProps) {
  const t = useTranslations('face_check.console.detail.documentCheck')
  const icon =
    result === true ? (
      <CheckRoundedIcon />
    ) : result === false ? (
      <PriorityHighRoundedIcon />
    ) : (
      <RemoveRoundedIcon />
    )

  return (
    <Box sx={styles.checkRow}>
      <Box>
        <Typography sx={styles.signalLabel}>{label}</Typography>
        <Typography sx={styles.signalHelp}>{detail}</Typography>
      </Box>
      <Chip
        size="small"
        icon={icon}
        label={t(result === true ? 'ok' : result === false ? 'notOk' : 'unknown')}
        sx={styles.checkResult(result)}
      />
    </Box>
  )
}

export function DocumentCheckCard({ session }: SessionCardProps) {
  const t = useTranslations('face_check.console.detail.documentCheck')
  const tDocuments = useTranslations('face_check.console.documents')
  const check = session.documentCheck
  const attempt = session.attemptsUsed + (session.status === 'IN_PROGRESS' ? 1 : 0)
  const latestDocuments = (['front', 'back'] as const).map((side) =>
    session.evidenceHistory?.findLast(
      (item) => item.step === side && item.attempt === Math.max(1, attempt),
    ),
  )
  const unavailable = latestDocuments.some((item) => item?.status === 'unavailable')
  const hasDocument = latestDocuments.some(Boolean)

  if (session.captureMode !== 'camera') return null

  return (
    <Box component="section" aria-labelledby="document-check-title" sx={cardStyles.card}>
      <Box>
        <Typography id="document-check-title" component="h2" sx={cardStyles.title}>
          {t('title')}
        </Typography>
        <Typography sx={cardStyles.caption}>{t('subtitle')}</Typography>
      </Box>
      {!check || unavailable ? (
        <Typography sx={cardStyles.caption}>
          {t(unavailable ? 'unavailable' : hasDocument ? 'notRead' : 'empty')}
        </Typography>
      ) : null}
      <Box>
        <CheckRow
          label={t('card.label')}
          detail={t('card.help')}
          result={check?.cardDetected ?? null}
        />
        <CheckRow
          label={t('type.label')}
          detail={
            check?.documentTypeRead
              ? t('type.read', { type: tDocuments(check.documentTypeRead) })
              : t('type.notRead')
          }
          result={check?.documentTypeMatches ?? null}
        />
        <CheckRow
          label={t('name.label')}
          detail={t('name.help', { name: session.personName })}
          result={check?.nameFound ?? null}
        />
        <CheckRow
          label={t('cpf.label')}
          detail={
            session.cpf
              ? check?.cpfRead
                ? t('cpf.help', { cpf: maskCpf(session.cpf) })
                : t('cpf.notRead', { cpf: maskCpf(session.cpf) })
              : t('cpf.notInformed')
          }
          result={session.cpf && check?.cpfRead ? check.cpfMatches : null}
        />
      </Box>
    </Box>
  )
}

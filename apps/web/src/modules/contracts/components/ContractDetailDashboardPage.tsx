'use client'

import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link as MuiLink,
  Stack,
  Typography,
} from '@mui/material'
import { notFound, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { Link } from '@/i18n/navigation'
import { styles } from '../styles/contract-detail-dashboard-page.styles'
import { ContractDetailPanel } from './contract-detail/ContractDetailPanel'
import { ContractDetailHeader } from './contract-detail/ContractDetailHeader'
import { ContractInfoPanel } from './contract-detail/ContractInfoPanel'
import { ContractDocumentsPanel } from './contract-detail/ContractDocumentsPanel'
import { ContractPartiesPanel } from './contract-detail/ContractPartiesPanel'
import { ContractDocumentUpload } from './contract-detail/ContractDocumentUpload'
import { ContractManualSignatureDialog } from './contract-detail/ContractManualSignatureDialog'
import { ContractTransitionDialog } from './contract-detail/ContractTransitionDialog'
import { ContractEditDialog } from './contract-detail/ContractEditDialog'
import { ContractHistoryPanel } from './contract-detail/ContractHistoryPanel'
import {
  useContract,
  useSignContractParty,
  useTransitionContract,
  useLinkContractParty,
} from '../hooks/use-contracts'
import { useContractPresentation } from '../hooks/use-contract-presentation'
import { mapContractFromApi } from '../utils/contract-adapter'
import { contractError, isContractNotFound } from '../utils/contract-error'
import type { ContractDetailDashboardPageProps } from '../types/contract'
import type { ApiContractParty } from '../types/service'

export function ContractDetailDashboardPage({ contractId }: ContractDetailDashboardPageProps) {
  const { data: session } = useSession()
  const t = useTranslations('contracts.detail')
  const errors = useTranslations('contracts.errors')
  const { enqueueSnackbar } = useSnackbar()
  const presentation = useContractPresentation()
  const query = useContract(contractId)
  const signature = useSignContractParty(contractId)
  const transition = useTransitionContract(contractId)
  const link = useLinkContractParty(contractId)
  const [signParty, setSignParty] = useState<ApiContractParty | null>(null)
  const [linkParty, setLinkParty] = useState<ApiContractParty | null>(null)
  const [transitionAction, setTransitionAction] = useState<'cancel' | 'close' | null>(null)
  const searchParams = useSearchParams()
  const [editing, setEditing] = useState(() => searchParams.get('edit') === '1')
  const [uploading, setUploading] = useState(false)
  const canManage = session?.role === 'OWNER' || session?.role === 'AGENT'
  const canLink = session?.role === 'OWNER'

  if (query.isPending)
    return (
      <Stack alignItems="center" justifyContent="center" sx={styles.stack}>
        <CircularProgress />
      </Stack>
    )
  if (isContractNotFound(query.error)) notFound()
  if (!query.data)
    return (
      <Alert
        severity="error"
        action={<Button onClick={() => query.refetch()}>{t('retry')}</Button>}
      >
        {t('loadError')}
      </Alert>
    )

  const data = query.data
  const contract = mapContractFromApi(data, presentation)
  const beforeActivation = ['DRAFT', 'IN_REVIEW', 'AWAITING_SIGNATURE', 'SIGNED'].includes(
    data.status,
  )
  const canEdit =
    ['DRAFT', 'IN_REVIEW', 'AWAITING_SIGNATURE'].includes(data.status) &&
    !data.parties.some((party) => party.signatureStatus === 'SIGNED')
  const busy = uploading || signature.isPending || transition.isPending || link.isPending

  return (
    <Box sx={styles.box}>
      <Box sx={styles.box2}>
        <Stack direction="row" spacing={0.8} sx={styles.stack2}>
          <MuiLink component={Link} href="/dashboard/contracts" underline="hover" color="inherit">
            {t('contracts')}
          </MuiLink>
          <Typography sx={styles.typography}>›</Typography>
          <Typography sx={styles.typography3}>{data.code}</Typography>
        </Stack>
        <ContractDetailHeader
          contract={contract}
          readOnly={!canManage}
          canEdit={canEdit}
          canCancel={beforeActivation}
          canClose={data.status === 'ACTIVE'}
          busy={busy}
          onEdit={() => setEditing(true)}
          onCancel={() => {
            transition.reset()
            setTransitionAction('cancel')
          }}
          onClose={() => {
            transition.reset()
            setTransitionAction('close')
          }}
        />
        {uploading && <Alert severity="info">{t('uploadBusy')}</Alert>}
        {query.isError && (
          <Alert
            severity="error"
            action={<Button onClick={() => query.refetch()}>{t('retry')}</Button>}
          >
            {t('loadError')}
          </Alert>
        )}
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={3}
          alignItems="stretch"
          sx={styles.stack3}
        >
          <Stack spacing={3} sx={styles.stack4}>
            <ContractInfoPanel contract={contract} />
            <ContractDetailPanel title={t('notes')} sx={styles.contractDetailPanel}>
              <Typography sx={styles.typography4}>{contract.notes || t('emptyNotes')}</Typography>
            </ContractDetailPanel>
            <Box id="history">
              <ContractHistoryPanel contractId={contractId} />
            </Box>
          </Stack>
          <Stack spacing={3} sx={styles.stack5}>
            <ContractPartiesPanel
              parties={data.parties}
              isSigning={busy}
              readOnly={!canManage}
              canSign={beforeActivation}
              canLink={canLink}
              onSign={(id) => {
                signature.reset()
                setSignParty(data.parties.find((party) => party.id === id) ?? null)
              }}
              onLink={(party) => {
                link.reset()
                setLinkParty(party)
              }}
            />
            <Box id="documents">
              <ContractDocumentsPanel
                documents={data.documents}
                dataRevision={data.dataRevision}
                contractId={contractId}
              />
            </Box>
            {canManage && (
              <ContractDocumentUpload contractId={contractId} onBusyChange={setUploading} />
            )}
          </Stack>
        </Stack>
        {signParty && (
          <ContractManualSignatureDialog
            party={signParty}
            documents={data.documents}
            dataRevision={data.dataRevision}
            pending={signature.isPending}
            error={signature.error}
            onClose={() => setSignParty(null)}
            onConfirm={(documentId) =>
              signature.mutate(
                { partyId: signParty.id, documentId },
                { onSuccess: () => setSignParty(null) },
              )
            }
          />
        )}
        {transitionAction && (
          <ContractTransitionDialog
            action={transitionAction}
            pending={transition.isPending}
            error={transition.error}
            onClose={() => setTransitionAction(null)}
            onConfirm={(reason) =>
              transition.mutate(
                { action: transitionAction, reason },
                { onSuccess: () => setTransitionAction(null) },
              )
            }
          />
        )}
        {editing && canManage && canEdit && (
          <ContractEditDialog contract={data} onClose={() => setEditing(false)} />
        )}
        <Dialog
          open={Boolean(linkParty)}
          onClose={link.isPending ? undefined : () => setLinkParty(null)}
        >
          <DialogTitle>{t('link')}</DialogTitle>
          <DialogContent>
            <Typography>{t('linkNotice', { email: linkParty?.email ?? '' })}</Typography>
            {link.isError && <Alert severity="error">{contractError(link.error, errors)}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button disabled={link.isPending} onClick={() => setLinkParty(null)}>
              {t('back')}
            </Button>
            <Button
              disabled={link.isPending}
              onClick={() => {
                if (linkParty)
                  link.mutate(
                    { partyId: linkParty.id, email: linkParty.email },
                    {
                      onSuccess: () => {
                        setLinkParty(null)
                        enqueueSnackbar(t('linkSuccess'), { variant: 'success' })
                      },
                    },
                  )
              }}
            >
              {t('link')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  )
}

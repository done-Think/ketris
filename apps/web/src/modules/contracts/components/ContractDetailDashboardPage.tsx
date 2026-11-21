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
import { Link, useRouter } from '@/i18n/navigation'
import { canAccessFeature, resolveAccessProfile } from '@shared/lib/auth/access-policy'
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
import { ContractDetailTabs } from './contract-detail/ContractDetailTabs'
import { ContractRentCard } from './contract-detail/ContractRentCard'
import {
  useContract,
  useSignContractParty,
  useTransitionContract,
  useLinkContractParty,
} from '../hooks/use-contracts'
import { useContractPresentation } from '../hooks/use-contract-presentation'
import { mapContractFromApi } from '../utils/contract-adapter'
import { contractError, isContractNotFound } from '../utils/contract-error'
import { contractPartyLinkMessageKeys } from '../config/contract-labels'
import { contractDetailTabs, resolveContractDetailTab } from '../config/contract-detail-tabs'
import type { ContractDetailDashboardPageProps } from '../types/contract'
import type { ApiContractParty } from '../types/service'

export function ContractDetailDashboardPage({
  contractId,
  slots = {},
}: ContractDetailDashboardPageProps) {
  const { data: session } = useSession()
  const router = useRouter()
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
  const isRenter = session?.role === 'RENTER'
  const landlordView =
    !isRenter && Boolean(query.data) && query.data?.tenantId !== session?.tenantId
  const profile = resolveAccessProfile(session?.role, session?.accountType)
  const canSeeCharges = canAccessFeature(profile, 'charges')
  const tabs = contractDetailTabs.filter(
    (tab) =>
      (tab !== 'payments' || (canSeeCharges && Boolean(slots.payments))) &&
      (tab !== 'tickets' || (canAccessFeature(profile, 'maintenance') && Boolean(slots.tickets))),
  )
  const tab = resolveContractDetailTab(searchParams.get('tab'), tabs)
  const canManage = (session?.role === 'OWNER' || session?.role === 'AGENT') && !landlordView
  const canLink = session?.role === 'OWNER' && !landlordView

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
  const linkMessages =
    linkParty?.role === 'LANDLORD'
      ? contractPartyLinkMessageKeys.LANDLORD
      : contractPartyLinkMessageKeys.RENTER
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
            {t(isRenter ? 'myRental' : 'contracts')}
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
        {landlordView && (
          <Alert severity="info" sx={styles.landlordAlert}>
            {t('landlordView', { agency: data.agencyName })}
          </Alert>
        )}
        {canSeeCharges && slots.alerts && <Box sx={styles.alerts}>{slots.alerts}</Box>}
        {uploading && <Alert severity="info">{t('uploadBusy')}</Alert>}
        {query.isError && (
          <Alert
            severity="error"
            action={<Button onClick={() => query.refetch()}>{t('retry')}</Button>}
          >
            {t('loadError')}
          </Alert>
        )}
        <ContractDetailTabs
          value={tab}
          tabs={tabs}
          disabled={uploading}
          onChange={(next) =>
            router.replace(
              {
                pathname: '/dashboard/contracts/[id]',
                params: { id: contractId },
                query: { tab: next },
              },
              { scroll: false },
            )
          }
        />
        {tab === 'summary' && (
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
                {isRenter ? null : <ContractHistoryPanel contractId={contractId} />}
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
            </Stack>
          </Stack>
        )}
        {tab === 'payments' && (
          <Stack spacing={3}>
            <Box sx={styles.paymentSummary}>
              <ContractRentCard amount={contract.amount} dueDay={data.dueDay} />
              {slots.paymentSummary}
            </Box>
            {slots.payments}
          </Stack>
        )}
        {tab === 'documents' && (
          <Stack spacing={3} sx={styles.documents}>
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
        )}
        {tab === 'tickets' && slots.tickets}
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
          <DialogTitle>{t(linkMessages.action)}</DialogTitle>
          <DialogContent>
            <Typography>{t(linkMessages.notice, { email: linkParty?.email ?? '' })}</Typography>
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
              {t(linkMessages.action)}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  )
}

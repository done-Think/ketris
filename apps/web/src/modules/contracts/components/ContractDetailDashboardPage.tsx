'use client'

import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import { Box, Button, Chip, IconButton, Link as MuiLink, Stack, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { Link } from '@/i18n/navigation'
import {
  alpha,
  brand,
  iconSize,
  radius,
  shadows,
  supportColor,
  surface,
} from '@shared/theme/tokens'

import { contractStatusStyles } from '../config/contract-ui'
import { useContractsStore } from '../stores/contracts-store'
import type {
  ContractDetailDashboardPageProps,
  ContractDocumentItem,
  ContractListItem,
  ContractPaymentHistoryItem,
} from '../types/contract'

function DetailPanel({
  title,
  children,
  sx,
}: {
  title: string
  children: ReactNode
  sx?: SxProps<Theme>
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        bgcolor: surface.paper,
        border: '1px solid',
        borderColor: alpha.graphite[8],
        borderRadius: `${radius.sm}px`,
        boxShadow: shadows.crmCardCompact,
        p: { xs: 2, md: 3 },
        ...sx,
      }}
    >
      <Typography sx={{ mb: 2.8, color: brand.graphite[500], fontSize: 18, fontWeight: 900 }}>
        {title}
      </Typography>
      {children}
    </Box>
  )
}

function formatContractCode(code: string) {
  return code.replace(/^CTR-\d{4}-/, '#')
}

function ContractHeader({ contract }: { contract: ContractListItem }) {
  const statusStyle = contractStatusStyles[contract.status]

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', md: 'center' }}
      spacing={2}
      sx={{ mb: 2.8 }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1.6} sx={{ mb: 0.8 }}>
          <Chip
            label={contract.status}
            sx={{
              height: 28,
              borderRadius: `${radius.sm}px`,
              bgcolor: statusStyle.bgcolor,
              color: statusStyle.color,
              fontSize: 13,
              fontWeight: 900,
            }}
          />
          <Typography
            variant="h1"
            sx={{ color: brand.graphite[500], fontSize: { xs: 30, md: 36 }, fontWeight: 900 }}
          >
            Contrato {formatContractCode(contract.code)}
          </Typography>
        </Stack>
      </Box>

      <Stack direction="row" spacing={1.1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
        <Button variant="outlined" color="secondary" startIcon={<EditOutlinedIcon />}>
          Editar
        </Button>
        <Button variant="outlined" color="secondary" startIcon={<PictureAsPdfOutlinedIcon />}>
          PDF
        </Button>
        <Button
          variant="outlined"
          sx={{
            borderColor: alpha.error[10],
            color: brand.semantic.error,
            '&:hover': { borderColor: brand.semantic.error, bgcolor: alpha.error[6] },
          }}
        >
          Rescindir
        </Button>
      </Stack>
    </Stack>
  )
}

const infoRowSx = {
  py: { xs: 1.35, md: 1.65 },
  borderBottom: '1px solid',
  borderColor: alpha.graphite[8],
  '&:last-child': { borderBottom: 0 },
} as const

const infoLabelSx = { color: brand.neutral[500], fontSize: 15, fontWeight: 700 } as const

const infoValueSx = {
  color: brand.graphite[500],
  fontSize: 15,
  fontWeight: 900,
  textAlign: 'right',
} as const

function ContractInfoPanel({ contract }: { contract: ContractListItem }) {
  const rows = [
    { label: 'Locatario', value: contract.tenant },
    { label: 'Valor', value: `${contract.amount}/mes` },
    { label: 'Reajuste', value: contract.adjustment },
    { label: 'Inicio', value: contract.startDate },
    { label: 'Vencimento', value: contract.endDate },
    { label: 'Dia pagamento', value: contract.paymentDay },
    { label: 'Garantia', value: contract.guarantee },
  ]

  return (
    <DetailPanel title="Dados do Contrato" sx={{ height: '100%' }}>
      <Stack sx={{ flex: 1, justifyContent: 'space-between' }}>
        <Stack direction="row" justifyContent="space-between" spacing={2} sx={infoRowSx}>
          <Typography sx={infoLabelSx}>Imovel</Typography>
          <MuiLink
            component={Link}
            href={{ pathname: '/dashboard/properties/[id]', params: { id: contract.propertyId } }}
            underline="hover"
            sx={{ color: brand.magenta[500], fontSize: 15, fontWeight: 900 }}
          >
            {contract.property}
          </MuiLink>
        </Stack>
        {rows.map((row) => (
          <Stack
            key={row.label}
            direction="row"
            justifyContent="space-between"
            spacing={2}
            sx={infoRowSx}
          >
            <Typography sx={infoLabelSx}>{row.label}</Typography>
            <Typography sx={infoValueSx}>{row.value}</Typography>
          </Stack>
        ))}
      </Stack>
    </DetailPanel>
  )
}

function PaymentStatusChip({ status }: { status: ContractPaymentHistoryItem['status'] }) {
  const isPaid = status === 'Pago'

  return (
    <Chip
      label={status}
      size="small"
      sx={{
        height: 24,
        minWidth: 70,
        borderRadius: `${radius.sm}px`,
        bgcolor: isPaid ? supportColor.successSoft : supportColor.warningSoft,
        color: isPaid ? brand.semantic.success : brand.semantic.warning,
        fontSize: 12,
        fontWeight: 900,
      }}
    />
  )
}

function PaymentHistoryPanel({ payments }: { payments: ContractPaymentHistoryItem[] }) {
  return (
    <DetailPanel title="Historico de Pagamentos" sx={{ flex: 1.1 }}>
      <Stack sx={{ flex: 1, justifyContent: 'space-between' }}>
        {payments.map((payment) => (
          <Stack
            key={payment.period}
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{
              minHeight: { xs: 44, md: 53 },
              borderBottom: '1px solid',
              borderColor: alpha.graphite[8],
              '&:last-child': { borderBottom: 0 },
            }}
          >
            <Typography sx={{ flex: 1, color: brand.graphite[500], fontSize: 14, fontWeight: 900 }}>
              {payment.period}
            </Typography>
            <Typography sx={{ color: brand.neutral[500], fontSize: 14, fontWeight: 800 }}>
              {payment.amount}
            </Typography>
            <PaymentStatusChip status={payment.status} />
            <Typography
              sx={{
                width: 42,
                color: brand.neutral[400],
                fontSize: 12,
                fontWeight: 700,
                textAlign: 'right',
              }}
            >
              {payment.date}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </DetailPanel>
  )
}

function DocumentsPanel({ documents }: { documents: ContractDocumentItem[] }) {
  return (
    <DetailPanel title="Documentos" sx={{ flex: 1 }}>
      <Stack spacing={1.6} sx={{ flex: 1, justifyContent: 'space-between' }}>
        {documents.map((document) => (
          <Stack
            key={document.name}
            direction="row"
            alignItems="center"
            spacing={1.3}
            sx={{
              minHeight: { xs: 58, md: 72 },
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.app,
              px: 1.6,
            }}
          >
            <ArticleOutlinedIcon sx={{ color: brand.magenta[500], fontSize: iconSize.xl }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography noWrap sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 900 }}>
                {document.name}
              </Typography>
              <Typography noWrap sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 700 }}>
                {document.sentAt}
              </Typography>
            </Box>
            <IconButton
              aria-label={`Baixar ${document.name}`}
              sx={{
                width: 34,
                height: 34,
                borderRadius: `${radius.sm}px`,
                bgcolor: surface.paper,
                color: brand.graphite[500],
              }}
            >
              <DownloadOutlinedIcon sx={{ fontSize: iconSize.md }} />
            </IconButton>
          </Stack>
        ))}
      </Stack>
    </DetailPanel>
  )
}

export function ContractDetailDashboardPage({ contractId }: ContractDetailDashboardPageProps) {
  const contract = useContractsStore((state) =>
    state.contracts.find((item) => item.id === contractId),
  )

  if (!contract) notFound()

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 4.8 }, py: { xs: 2.6, md: 3.2 } }}>
      <Box sx={{ width: '100%' }}>
        <Stack
          direction="row"
          spacing={0.8}
          sx={{ mb: 2, color: brand.neutral[500], fontSize: 13 }}
        >
          <MuiLink component={Link} href="/dashboard/contracts" underline="hover" color="inherit">
            Contratos
          </MuiLink>
          <Typography sx={{ fontSize: 13 }}>›</Typography>
          <MuiLink
            component={Link}
            href={{ pathname: '/dashboard/properties/[id]', params: { id: contract.propertyId } }}
            underline="hover"
            color="inherit"
            sx={{ fontSize: 13 }}
          >
            {contract.property}
          </MuiLink>
          <Typography sx={{ fontSize: 13 }}>›</Typography>
          <Typography sx={{ color: brand.magenta[500], fontSize: 13, fontWeight: 900 }}>
            Contrato {formatContractCode(contract.code)}
          </Typography>
        </Stack>

        <ContractHeader contract={contract} />

        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={3}
          alignItems="stretch"
          sx={{ minHeight: { lg: 'calc(100vh - 210px)' } }}
        >
          <Stack spacing={3} sx={{ flex: 1.25, minWidth: 0 }}>
            <ContractInfoPanel contract={contract} />
            <DetailPanel title="Clausulas e Observacoes" sx={{ flex: 1 }}>
              <Typography
                sx={{
                  color: brand.neutral[500],
                  fontSize: 15,
                  lineHeight: 1.8,
                  fontWeight: 700,
                }}
              >
                {contract.notes}
              </Typography>
            </DetailPanel>
          </Stack>

          <Stack spacing={3} sx={{ flex: 1, minWidth: 0 }}>
            <PaymentHistoryPanel payments={contract.paymentHistory} />
            <DocumentsPanel documents={contract.documents} />
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}

import type { ReactNode } from 'react'

import type { ApiChargeAuditAction } from './service'

export type ChargeDirection = 'receivable' | 'payable'

export type ChargeStatus = 'pending' | 'overdue' | 'paid' | 'scheduled' | 'cancelled'

export type ChargeStatusFilter = 'all' | ChargeStatus

export type NewChargeStatus = Extract<ChargeStatus, 'pending' | 'scheduled'>

export interface ChargeReceipt {
  id: string
  name: string
  contentType: string
  size: number
  uploadedAt: string
}

export interface ChargeListRow {
  id: string
  code: string
  contractId: string | null
  direction: ChargeDirection
  description: string | null
  payer: string
  property: string
  amount: number
  dueDate: string
  status: ChargeStatus
}

export interface Charge extends ChargeListRow {
  competence: string
  contractCode: string | null
  payerEmail: string | null
  propertyAddress: string | null
  open: boolean
  payment: { date: string; method: string } | null
  cancellation: { date: string | null; reason: string | null } | null
  receipt: ChargeReceipt | null
}

export interface ChargeHistoryItem {
  id: string
  action: ApiChargeAuditAction
  actorName: string | null
  date: string
  reason: string | null
  changedFields: string[]
  receipt: ChargeReceipt | null
}

export interface ChargeFormValues {
  description: string
  amount: number
  dueDate: string
  direction: ChargeDirection
  status: NewChargeStatus
}

export interface PaymentFormValues {
  paymentDate: string
  paymentMethod: string
  receipt: File | null
}

export interface ReasonFormValues {
  reason: string
}

export interface ChargesPageFilters {
  direction: ChargeDirection
  status: ChargeStatusFilter
  search: string
  page: number
  rowsPerPage: number
}

export type ChargesPageDialog =
  | { kind: 'create' }
  | { kind: 'edit'; charge: ChargeListRow }
  | { kind: 'cancel'; charge: ChargeListRow }
  | { kind: 'delete'; charge: ChargeListRow }

export type ChargeStatusCounts = Record<ChargeStatusFilter, number>

export interface ChargeStatusStyle {
  bgcolor: string
  color: string
}

export type ChargeReasonKind = 'cancel' | 'reverse'

export type MetricTone = 'success' | 'error' | 'warning'

export interface MetricProps {
  label: string
  value: string
  icon: ReactNode
  tone: MetricTone
}

export interface ChargeRowProps {
  charge: ChargeListRow
  zebra: boolean
  readOnly: boolean
  onView: () => void
  onEdit: () => void
  onCancel: () => void
  onDelete: () => void
}

export interface ChargesTableProps {
  rows: ChargeListRow[]
  readOnly: boolean
  totalCount: number
  page: number
  rowsPerPage: number
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rowsPerPage: number) => void
  onView: (charge: ChargeListRow) => void
  onEdit: (charge: ChargeListRow) => void
  onCancel: (charge: ChargeListRow) => void
  onDelete: (charge: ChargeListRow) => void
}

export interface ChargeStatusFiltersProps {
  value: ChargeStatusFilter
  counts?: ChargeStatusCounts
  onChange: (status: ChargeStatusFilter) => void
}

export interface ChargesHeaderActionsProps {
  search: string
  canCreate: boolean
  onSearchChange: (search: string) => void
  onCreate: () => void
}

export interface ChargesKpisProps {
  month?: string
}

export interface ChargeFormDialogProps {
  open: boolean
  charge: ChargeListRow | null
  pending: boolean
  onClose: () => void
  onSubmit: (values: ChargeFormValues) => void
}

export interface ChargeReasonDialogProps {
  open: boolean
  kind: ChargeReasonKind
  pending: boolean
  onClose: () => void
  onSubmit: (values: ReasonFormValues) => void
}

export interface DeleteChargeDialogProps {
  open: boolean
  pending: boolean
  onClose: () => void
  onConfirm: () => void
}

export interface RegisterPaymentDialogProps {
  open: boolean
  pending: boolean
  onClose: () => void
  onSubmit: (values: PaymentFormValues) => void
}

export interface ChargeStatusChipProps {
  status: ChargeStatus
}

export interface ChargeDetailsPageProps {
  chargeId: string
}

export interface ChargeDetailsContentProps {
  charge: Charge
}

export interface ChargeSectionCardProps {
  title: string
  children: ReactNode
}

export interface ChargeReceiptCardProps {
  charge: Charge
}

export interface ChargeHistoryCardProps {
  chargeId: string
}

export interface ChargeLinksCardProps {
  charge: Charge
}

export interface ChargeDetailFieldsProps {
  charge: Charge
}

export interface FinancialDialogTitleProps {
  title: string
  closeLabel: string
  onClose: () => void
}

export interface ChargeFormFieldsProps {
  locked: boolean
  creating: boolean
}

export interface ChargeDetailHeaderProps {
  charge: Charge
  canManage: boolean
  onRegisterPayment: () => void
  onReversePayment: () => void
  onCancel: () => void
}

export interface ChargeReceiptLinkProps {
  chargeId: string
  receipt: ChargeReceipt
}

export interface ReceiptFileFieldProps {
  file: File | null
  error?: string
  onChange: (file: File | null) => void
}

export type ChargeDetailDialog = 'payment' | 'reverse' | 'cancel'

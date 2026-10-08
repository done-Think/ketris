import type { ReactNode } from 'react'

export type ChargeDirection = 'receivable' | 'payable'
export type ChargeStatus = 'pending' | 'overdue' | 'paid' | 'scheduled' | 'cancelled'

export interface Charge {
  id: string
  code: string
  direction: ChargeDirection
  description: string | null
  tenant: string
  property: string
  amount: number
  dueDate: string
  status: ChargeStatus
  competence: string
  contractCode?: string
  contact?: string
  address?: string
  payment?: PaymentFormValues
  receiptReference?: string
  history: ChargeHistoryEvent[]
}

export interface PaymentFormValues {
  paymentDate: string
  paymentMethod: string
}

export interface ChargeHistoryEvent {
  type: 'generated' | 'issued' | 'received' | 'updated'
  date: string
}

export type CreateChargeFormValues = {
  description: string
  amount: number
  dueDate: string
  direction: ChargeDirection
  status: Extract<ChargeStatus, 'pending' | 'scheduled'>
}

export type UpdateChargeFormValues = {
  description: string
  amount: number
  dueDate: string
  direction: ChargeDirection
  status: ChargeStatus
}

export type MetricProps = {
  label: string
  value: string
  icon: ReactNode
  tone: 'success' | 'error' | 'warning'
}

export type ChargeRowProps = {
  charge: Charge
  locale: string
  zebra: boolean
  labels: Record<string, string>
  onEdit: () => void
  onArchive: () => void
  onView: () => void
}

import dayjs from 'dayjs'

import type {
  Charge,
  ChargeDirection,
  ChargeHistoryEvent,
  ChargeStatus,
  CreateChargeFormValues,
  PaymentFormValues,
  UpdateChargeFormValues,
} from '../types/charge'
import type {
  ApiCharge,
  ApiChargeListItem,
  ApiChargeStatus,
  ApiChargeType,
  ApiNewChargeStatus,
  CreateChargePayload,
  RegisterChargePaymentPayload,
  UpdateChargePayload,
} from '../types/service'

const chargeTypeToDirection: Record<ApiChargeType, ChargeDirection> = {
  A_RECEBER: 'receivable',
  A_PAGAR: 'payable',
}

const directionToChargeType: Record<ChargeDirection, ApiChargeType> = {
  receivable: 'A_RECEBER',
  payable: 'A_PAGAR',
}

const chargeStatusToUi: Record<ApiChargeStatus, ChargeStatus> = {
  PENDENTE: 'pending',
  PAGA: 'paid',
  ATRASADA: 'overdue',
  AGENDADA: 'scheduled',
  CANCELADA: 'cancelled',
}

const chargeStatusToApi: Record<ChargeStatus, ApiChargeStatus> = {
  pending: 'PENDENTE',
  paid: 'PAGA',
  overdue: 'ATRASADA',
  scheduled: 'AGENDADA',
  cancelled: 'CANCELADA',
}

const newChargeStatusToApi: Record<CreateChargeFormValues['status'], ApiNewChargeStatus> = {
  pending: 'PENDENTE',
  scheduled: 'AGENDADA',
}

export function mapChargeTypeToDirection(type: ApiChargeType): ChargeDirection {
  return chargeTypeToDirection[type]
}

export function mapChargeStatusToUi(status: ApiChargeStatus): ChargeStatus {
  return chargeStatusToUi[status]
}

export function mapChargeListItemFromApi(item: ApiChargeListItem): Charge {
  return {
    id: item.id,
    code: item.code,
    direction: mapChargeTypeToDirection(item.type),
    description: item.description,
    tenant: item.payerName ?? item.description ?? '',
    property: item.propertyTitle ?? '',
    amount: item.amount,
    dueDate: item.dueDate.slice(0, 10),
    status: mapChargeStatusToUi(item.status),
    competence: item.dueDate.slice(0, 7),
    contractCode: item.contractId ?? undefined,
    history: [],
  }
}

export function mapChargeFromApi(charge: ApiCharge): Charge {
  const payment: PaymentFormValues | undefined = charge.paidAt
    ? { paymentDate: charge.paidAt.slice(0, 10), paymentMethod: charge.paymentMethod ?? '' }
    : undefined
  const history: ChargeHistoryEvent[] = [
    { type: 'generated', date: charge.createdAt.slice(0, 10) },
    ...(payment ? [{ type: 'received' as const, date: payment.paymentDate }] : []),
  ]

  return {
    id: charge.id,
    code: charge.code,
    direction: mapChargeTypeToDirection(charge.type),
    description: charge.description,
    tenant: charge.payerName ?? charge.description ?? '',
    property: charge.propertyTitle ?? '',
    amount: charge.amount,
    dueDate: charge.dueDate.slice(0, 10),
    status: mapChargeStatusToUi(charge.status),
    competence: charge.dueDate.slice(0, 7),
    contractCode: charge.contractCode ?? undefined,
    contact: charge.payerEmail ?? undefined,
    address: charge.propertyAddress ?? undefined,
    payment,
    receiptReference: charge.receiptUrl ?? undefined,
    history,
  }
}

export function buildCreateChargePayload(values: CreateChargeFormValues): CreateChargePayload {
  return {
    description: values.description.trim(),
    type: directionToChargeType[values.direction],
    amount: values.amount,
    dueDate: values.dueDate,
    status: newChargeStatusToApi[values.status],
  }
}

export function buildUpdateChargePayload(values: UpdateChargeFormValues): UpdateChargePayload {
  return {
    description: values.description.trim() || null,
    type: directionToChargeType[values.direction],
    amount: values.amount,
    dueDate: values.dueDate,
    status: chargeStatusToApi[values.status],
  }
}

export function buildRegisterPaymentPayload(
  values: PaymentFormValues,
): RegisterChargePaymentPayload {
  return {
    paidAt: values.paymentDate,
    paymentMethod: values.paymentMethod,
    receiptUrl: null,
  }
}

export function getMonthlyReceivable(
  charges: readonly Charge[],
  month: string = dayjs().format('YYYY-MM'),
) {
  return charges
    .filter(
      (charge) =>
        charge.direction === 'receivable' &&
        charge.competence === month &&
        (charge.status === 'pending' || charge.status === 'scheduled'),
    )
    .reduce((total, charge) => total + charge.amount, 0)
}

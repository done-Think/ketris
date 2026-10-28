import type { ChargeExportRow } from '../types/charge-entity'
import type { ChargeExportLocale, ChargeStatus, ChargeType } from '../types/charge'

const headers: Record<ChargeExportLocale, string[]> = {
  'pt-BR': [
    'Código',
    'Descrição',
    'Imóvel',
    'Locatário',
    'Tipo',
    'Vencimento',
    'Valor',
    'Status',
    'Pago em',
    'Forma de pagamento',
  ],
  'en-US': [
    'Code',
    'Description',
    'Property',
    'Tenant',
    'Type',
    'Due date',
    'Amount',
    'Status',
    'Paid on',
    'Payment method',
  ],
  'es-ES': [
    'Código',
    'Descripción',
    'Inmueble',
    'Inquilino',
    'Tipo',
    'Vencimiento',
    'Importe',
    'Estado',
    'Pagado el',
    'Forma de pago',
  ],
}

const types: Record<ChargeExportLocale, Record<ChargeType, string>> = {
  'pt-BR': { RECEIVABLE: 'A receber', PAYABLE: 'A pagar' },
  'en-US': { RECEIVABLE: 'Receivable', PAYABLE: 'Payable' },
  'es-ES': { RECEIVABLE: 'A cobrar', PAYABLE: 'A pagar' },
}

const statuses: Record<ChargeExportLocale, Record<ChargeStatus, string>> = {
  'pt-BR': {
    PENDING: 'Pendente',
    OVERDUE: 'Atrasada',
    PAID: 'Paga',
    SCHEDULED: 'Agendada',
    CANCELED: 'Cancelada',
  },
  'en-US': {
    PENDING: 'Pending',
    OVERDUE: 'Overdue',
    PAID: 'Paid',
    SCHEDULED: 'Scheduled',
    CANCELED: 'Cancelled',
  },
  'es-ES': {
    PENDING: 'Pendiente',
    OVERDUE: 'Vencida',
    PAID: 'Pagada',
    SCHEDULED: 'Programada',
    CANCELED: 'Cancelada',
  },
}

function cell(value: string | null): string {
  const text = value ?? ''
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

function date(value: Date | null): string {
  if (!value) return ''
  const day = String(value.getUTCDate()).padStart(2, '0')
  const month = String(value.getUTCMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${value.getUTCFullYear()}`
}

function amount(value: number): string {
  return value.toFixed(2).replace('.', ',')
}

export function chargesToCsv(rows: ChargeExportRow[], locale: ChargeExportLocale): string {
  const lines = rows.map((row) =>
    [
      cell(row.code),
      cell(row.description),
      cell(row.propertyTitle),
      cell(row.payerName),
      cell(types[locale][row.type]),
      date(row.dueDate),
      amount(row.amount),
      cell(statuses[locale][row.status]),
      date(row.paidAt),
      cell(row.paymentMethod),
    ].join(';'),
  )

  return `﻿${[headers[locale].map(cell).join(';'), ...lines].join('\r\n')}\r\n`
}

export function chargesCsvFileName(year: number, month: number): string {
  return `cobrancas-${year}-${String(month).padStart(2, '0')}.csv`
}

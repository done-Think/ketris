import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

import { financialQueryKeys } from '../config/financial-query-keys'
import { financialService } from '../services/financial-service'
import type {
  ChargeFormValues,
  ChargeListRow,
  PaymentFormValues,
  ReasonFormValues,
} from '../types/charge'
import type { ApiCharge, ChargeListFilters } from '../types/service'
import {
  buildCreateChargePayload,
  buildUpdateChargePayload,
  mapChargeFromApi,
  mapHistoryEventFromApi,
} from '../utils/charge-adapter'

function useFinancialScope() {
  const { data: session } = useSession()
  const tenantId = session?.tenantId ?? ''
  const actorKey = `${session?.user?.id ?? ''}:${session?.role ?? ''}`

  return { tenantId, actorKey, role: session?.role, enabled: Boolean(session?.tenantId) }
}

function keepPreviousInScope(tenantId: string, actorKey: string) {
  return <T>(previous: T | undefined, previousQuery?: { queryKey: readonly unknown[] }) =>
    previousQuery?.queryKey[1] === tenantId && previousQuery.queryKey.includes(actorKey)
      ? previous
      : undefined
}

function useInvalidateFinancial() {
  const queryClient = useQueryClient()
  const { tenantId, actorKey } = useFinancialScope()

  return (charge?: ApiCharge) => {
    if (charge) {
      queryClient.setQueryData(
        financialQueryKeys.chargeDetail(tenantId, actorKey, charge.id),
        charge,
      )
    }
    void queryClient.invalidateQueries({ queryKey: financialQueryKeys.tenant(tenantId) })
    void queryClient.invalidateQueries({ queryKey: ['dashboard', tenantId] })
  }
}

export function useCharges(filters: ChargeListFilters) {
  const { tenantId, actorKey, enabled } = useFinancialScope()

  return useQuery({
    queryKey: financialQueryKeys.chargesList(tenantId, actorKey, filters),
    queryFn: () => financialService.listCharges(filters),
    enabled,
    placeholderData: keepPreviousInScope(tenantId, actorKey),
  })
}

export function useCharge(chargeId: string) {
  const { tenantId, actorKey, enabled } = useFinancialScope()

  return useQuery({
    queryKey: financialQueryKeys.chargeDetail(tenantId, actorKey, chargeId),
    queryFn: () => financialService.getCharge(chargeId),
    select: mapChargeFromApi,
    enabled: enabled && Boolean(chargeId),
  })
}

export function useChargeHistory(chargeId: string) {
  const { tenantId, actorKey, role, enabled } = useFinancialScope()

  return useQuery({
    queryKey: financialQueryKeys.chargeHistory(tenantId, actorKey, chargeId),
    queryFn: () => financialService.getHistory(chargeId),
    select: (data) => data.events.map(mapHistoryEventFromApi),
    enabled: enabled && role === 'OWNER',
  })
}

export function useFinancialSummary(month?: string) {
  const { tenantId, actorKey, role, enabled } = useFinancialScope()

  return useQuery({
    queryKey: financialQueryKeys.summary(tenantId, actorKey, month ?? null),
    queryFn: () => financialService.getSummary(month),
    enabled: enabled && role === 'OWNER',
    placeholderData: keepPreviousInScope(tenantId, actorKey),
  })
}

export function useCreateCharge() {
  const invalidate = useInvalidateFinancial()

  return useMutation({
    mutationFn: (values: ChargeFormValues) =>
      financialService.createCharge(buildCreateChargePayload(values)),
    onSuccess: (charge) => invalidate(charge),
  })
}

export function useUpdateCharge() {
  const invalidate = useInvalidateFinancial()

  return useMutation({
    mutationFn: ({ charge, values }: { charge: ChargeListRow; values: ChargeFormValues }) =>
      financialService.updateCharge(charge.id, buildUpdateChargePayload(charge, values)),
    onSuccess: (charge) => invalidate(charge),
  })
}

export function useDeleteCharge() {
  const invalidate = useInvalidateFinancial()

  return useMutation({
    mutationFn: (chargeId: string) => financialService.deleteCharge(chargeId),
    onSuccess: () => invalidate(),
  })
}

export function useCancelCharge() {
  const invalidate = useInvalidateFinancial()

  return useMutation({
    mutationFn: ({ chargeId, values }: { chargeId: string; values: ReasonFormValues }) =>
      financialService.cancelCharge(chargeId, { reason: values.reason.trim() }),
    onSuccess: (charge) => invalidate(charge),
  })
}

export function useReverseChargePayment() {
  const invalidate = useInvalidateFinancial()

  return useMutation({
    mutationFn: ({ chargeId, values }: { chargeId: string; values: ReasonFormValues }) =>
      financialService.reversePayment(chargeId, { reason: values.reason.trim() }),
    onSuccess: (charge) => invalidate(charge),
  })
}

export function useRegisterChargePayment() {
  const invalidate = useInvalidateFinancial()

  return useMutation({
    mutationFn: async ({ chargeId, values }: { chargeId: string; values: PaymentFormValues }) => {
      const receiptUploadToken = values.receipt
        ? await financialService.uploadReceipt(chargeId, values.receipt)
        : undefined

      return financialService.registerPayment(chargeId, {
        paidAt: values.paymentDate,
        paymentMethod: values.paymentMethod.trim(),
        ...(receiptUploadToken ? { receiptUploadToken } : {}),
      })
    },
    onSuccess: (charge) => invalidate(charge),
  })
}

export function useDownloadChargeReceipt(chargeId: string) {
  return useMutation({
    mutationFn: (receiptId: string) => financialService.downloadReceipt(chargeId, receiptId),
    onSuccess: ({ url }) => window.location.assign(url),
  })
}

export function useExportCharges() {
  return useMutation({
    mutationFn: ({ month, locale }: { month: string; locale: string }) =>
      financialService.exportCharges(month, locale),
    onSuccess: (blob, { month }) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cobrancas-${month}.csv`
      link.click()
      URL.revokeObjectURL(url)
    },
  })
}

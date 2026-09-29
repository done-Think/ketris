import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { financialService } from '../services/financial-service'
import type { ChargeListFilters } from '../types/service'
import type {
  CreateChargeFormValues,
  PaymentFormValues,
  UpdateChargeFormValues,
} from '../types/charge'
import {
  buildCreateChargePayload,
  buildRegisterPaymentPayload,
  buildUpdateChargePayload,
} from '../utils/charge-adapter'

function normalizeFilters(filters: ChargeListFilters) {
  return {
    type: filters.type ?? null,
    status: filters.status ?? null,
    search: filters.search ?? null,
    page: filters.page ?? null,
    pageSize: filters.pageSize ?? null,
  }
}

export const financialQueryKeys = {
  all: ['financial'] as const,
  tenant: (tenantId: string) => [...financialQueryKeys.all, tenantId] as const,
  charges: (tenantId: string) => [...financialQueryKeys.tenant(tenantId), 'charges'] as const,
  chargesList: (tenantId: string, filters: ChargeListFilters = {}) =>
    [...financialQueryKeys.charges(tenantId), 'list', normalizeFilters(filters)] as const,
  chargeDetails: (tenantId: string) => [...financialQueryKeys.charges(tenantId), 'detail'] as const,
  chargeDetail: (tenantId: string, chargeId: string) =>
    [...financialQueryKeys.chargeDetails(tenantId), chargeId] as const,
  summary: (tenantId: string) => [...financialQueryKeys.tenant(tenantId), 'summary'] as const,
}

export function useCharges(tenantId: string | null | undefined, filters: ChargeListFilters = {}) {
  const scopedTenantId = tenantId ?? ''

  return useQuery({
    queryKey: financialQueryKeys.chargesList(scopedTenantId, filters),
    queryFn: () => financialService.listCharges(filters),
    enabled: Boolean(tenantId),
  })
}

export function useCharge(
  tenantId: string | null | undefined,
  chargeId: string | null | undefined,
) {
  const scopedTenantId = tenantId ?? ''
  const scopedChargeId = chargeId ?? ''

  return useQuery({
    queryKey: financialQueryKeys.chargeDetail(scopedTenantId, scopedChargeId),
    queryFn: () => financialService.getCharge(scopedChargeId),
    enabled: Boolean(tenantId) && Boolean(chargeId),
  })
}

export function useCreateCharge(tenantId: string | null | undefined) {
  const queryClient = useQueryClient()
  const scopedTenantId = tenantId ?? ''

  return useMutation({
    mutationFn: (values: CreateChargeFormValues) =>
      financialService.createCharge(buildCreateChargePayload(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialQueryKeys.charges(scopedTenantId) })
      queryClient.invalidateQueries({ queryKey: financialQueryKeys.summary(scopedTenantId) })
    },
  })
}

export function useUpdateCharge(tenantId: string | null | undefined) {
  const queryClient = useQueryClient()
  const scopedTenantId = tenantId ?? ''

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: UpdateChargeFormValues }) =>
      financialService.updateCharge(id, buildUpdateChargePayload(values)),
    onSuccess: (charge) => {
      queryClient.setQueryData(financialQueryKeys.chargeDetail(scopedTenantId, charge.id), charge)
      queryClient.invalidateQueries({ queryKey: financialQueryKeys.charges(scopedTenantId) })
      queryClient.invalidateQueries({ queryKey: financialQueryKeys.summary(scopedTenantId) })
    },
  })
}

export function useRegisterChargePayment(tenantId: string | null | undefined, chargeId: string) {
  const queryClient = useQueryClient()
  const scopedTenantId = tenantId ?? ''

  return useMutation({
    mutationFn: (values: PaymentFormValues) =>
      financialService.registerPayment(chargeId, buildRegisterPaymentPayload(values)),
    onSuccess: (charge) => {
      queryClient.setQueryData(financialQueryKeys.chargeDetail(scopedTenantId, chargeId), charge)
      queryClient.invalidateQueries({ queryKey: financialQueryKeys.charges(scopedTenantId) })
      queryClient.invalidateQueries({ queryKey: financialQueryKeys.summary(scopedTenantId) })
    },
  })
}

export function useFinancialSummary(tenantId: string | null | undefined) {
  const scopedTenantId = tenantId ?? ''

  return useQuery({
    queryKey: financialQueryKeys.summary(scopedTenantId),
    queryFn: () => financialService.getSummary(),
    enabled: Boolean(tenantId),
  })
}

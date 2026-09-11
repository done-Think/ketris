import { useContractsStore } from '../stores/contracts-store'

/**
 * Thin hook boundary around the mock store — components depend on this, not on
 * `useContractsStore` directly, so swapping the mock store for a real API later (once a `contracts`
 * backend exists) only changes this file, not every consumer.
 */
export function useContracts() {
  return useContractsStore((state) => state.contracts)
}

export function useCreateContract() {
  return useContractsStore((state) => state.addContract)
}

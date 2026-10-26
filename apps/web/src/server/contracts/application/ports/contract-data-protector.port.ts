import type { ContractCpfContext } from '../../types/data-protection'

export interface ContractDataProtector {
  encryptCpf(value: string, context: ContractCpfContext): string
  decryptCpf(value: string, context: ContractCpfContext): string
}

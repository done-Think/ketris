import type { ApiContract } from './service'

export interface ContractPresentation {
  date: (value: string) => string
  money: (value: number) => string
  adjustment: (value: ApiContract['adjustmentIndex']) => string
  guarantee: (value: ApiContract['guaranteeType']) => string
  paymentDay: (day: number) => string
}

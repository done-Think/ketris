import type { CrmScope } from './prisma'
import type { InteractionPage, InteractionTarget } from './interaction'

export type ListInteractionsInput = CrmScope & {
  target: InteractionTarget
  page: number
  pageSize: number
}
export type ListInteractionsOutput = InteractionPage

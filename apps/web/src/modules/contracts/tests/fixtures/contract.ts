import { contractSchema } from '@server/contracts/schemas/contract.schema'
import { contractFixture } from '@server/contracts/tests/fixtures/contract'
import type { ApiContract } from '../../types/service'

export function apiContractFixture(overrides: Partial<ApiContract> = {}): ApiContract {
  return { ...contractSchema.parse(JSON.parse(JSON.stringify(contractFixture()))), ...overrides }
}

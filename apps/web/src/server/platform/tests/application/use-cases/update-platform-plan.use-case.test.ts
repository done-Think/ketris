import { describe, expect, it, vi } from 'vitest'

import type { PlatformPlanRepository } from '../../../application/ports/platform-plan-repository.port'
import { UpdatePlatformPlanUseCase } from '../../../application/use-cases/update-platform-plan.use-case'
import { PlatformPlanNotFoundError } from '../../../domain/errors'
import type { PlatformPlan } from '../../../types/platform-plan'

const actor = { id: 'admin-1', name: 'Sócia Ketris' }
const prices = { monthlyPrice: 129.9, includedUnits: 12, extraUnitPrice: 8.5 }
const updated: PlatformPlan = {
  accountType: 'BROKER',
  ...prices,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-10-28T00:00:00.000Z'),
  updatedBy: actor,
}

function repository(result: PlatformPlan | null): PlatformPlanRepository {
  return { findAll: vi.fn(), update: vi.fn().mockResolvedValue(result) }
}

describe('UpdatePlatformPlanUseCase', () => {
  it('grava os novos valores com o autor da mudança', async () => {
    const plans = repository(updated)

    await expect(
      new UpdatePlatformPlanUseCase(plans).execute({ accountType: 'BROKER', actor, ...prices }),
    ).resolves.toBe(updated)
    expect(plans.update).toHaveBeenCalledWith('BROKER', prices, actor)
  })

  it('responde plano não encontrado quando o tipo de conta não tem plano', async () => {
    await expect(
      new UpdatePlatformPlanUseCase(repository(null)).execute({
        accountType: 'INDIVIDUAL',
        actor,
        ...prices,
      }),
    ).rejects.toBeInstanceOf(PlatformPlanNotFoundError)
  })
})

import type { PlatformPlan as PrismaPlatformPlan } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type {
  PlatformPlanPrices,
  PlatformPlanRepository,
} from '../application/ports/platform-plan-repository.port'
import type { PlatformPlan } from '../domain/platform-plan'
import type { TenantAccountType } from '../domain/tenant-account'

const PLAN_ORDER: TenantAccountType[] = ['INDIVIDUAL', 'BROKER', 'AGENCY']

function toDomainPlatformPlan(plan: PrismaPlatformPlan): PlatformPlan {
  return {
    accountType: plan.accountType,
    monthlyPrice: plan.monthlyPrice.toNumber(),
    includedUnits: plan.includedUnits,
    extraUnitPrice: plan.extraUnitPrice.toNumber(),
    updatedAt: plan.updatedAt,
  }
}

export class PrismaPlatformPlanRepository implements PlatformPlanRepository {
  async findAll(): Promise<PlatformPlan[]> {
    const plans = await prisma.platformPlan.findMany()

    return plans
      .map(toDomainPlatformPlan)
      .sort((a, b) => PLAN_ORDER.indexOf(a.accountType) - PLAN_ORDER.indexOf(b.accountType))
  }

  async update(accountType: TenantAccountType, prices: PlatformPlanPrices): Promise<PlatformPlan> {
    const plan = await prisma.platformPlan.update({
      where: { accountType },
      data: {
        monthlyPrice: prices.monthlyPrice,
        includedUnits: prices.includedUnits,
        extraUnitPrice: prices.extraUnitPrice,
      },
    })

    return toDomainPlatformPlan(plan)
  }
}

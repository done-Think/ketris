import type { PlatformPlan as PrismaPlatformPlan } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type { PlatformPlanRepository } from '../application/ports/platform-plan-repository.port'
import type { PlatformPlanActor, PlatformPlanPrices } from '../types/platform-plan-repository'
import type { PlatformPlan } from '../types/platform-plan'
import type { TenantAccountType } from '../types/tenant-account'

const PLAN_ORDER: TenantAccountType[] = ['INDIVIDUAL', 'BROKER', 'AGENCY']

function toDomainPlatformPlan(plan: PrismaPlatformPlan): PlatformPlan {
  return {
    accountType: plan.accountType,
    monthlyPrice: plan.monthlyPrice.toNumber(),
    includedUnits: plan.includedUnits,
    extraUnitPrice: plan.extraUnitPrice.toNumber(),
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    updatedBy: plan.updatedByName ? { id: plan.updatedById, name: plan.updatedByName } : null,
  }
}

export class PrismaPlatformPlanRepository implements PlatformPlanRepository {
  async findAll(): Promise<PlatformPlan[]> {
    const plans = await prisma.platformPlan.findMany()

    return plans
      .map(toDomainPlatformPlan)
      .sort((a, b) => PLAN_ORDER.indexOf(a.accountType) - PLAN_ORDER.indexOf(b.accountType))
  }

  async update(
    accountType: TenantAccountType,
    prices: PlatformPlanPrices,
    actor: PlatformPlanActor,
  ): Promise<PlatformPlan | null> {
    return prisma.$transaction(async (transaction) => {
      const current = await transaction.platformPlan.findUnique({ where: { accountType } })
      if (!current) return null
      const plan = await transaction.platformPlan.update({
        where: { accountType },
        data: {
          monthlyPrice: prices.monthlyPrice,
          includedUnits: prices.includedUnits,
          extraUnitPrice: prices.extraUnitPrice,
          updatedById: actor.id,
          updatedByName: actor.name,
        },
      })
      await transaction.platformPlanChange.create({
        data: {
          accountType,
          previousMonthlyPrice: current.monthlyPrice,
          previousIncludedUnits: current.includedUnits,
          previousExtraUnitPrice: current.extraUnitPrice,
          monthlyPrice: prices.monthlyPrice,
          includedUnits: prices.includedUnits,
          extraUnitPrice: prices.extraUnitPrice,
          changedById: actor.id,
          changedByName: actor.name,
        },
      })

      return toDomainPlatformPlan(plan)
    })
  }
}

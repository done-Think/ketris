import { CreateChargeUseCase } from './application/use-cases/create-charge.use-case'
import { GetChargeUseCase } from './application/use-cases/get-charge.use-case'
import { GetFinancialSummaryUseCase } from './application/use-cases/get-financial-summary.use-case'
import { ListChargesUseCase } from './application/use-cases/list-charges.use-case'
import { RegisterChargePaymentUseCase } from './application/use-cases/register-charge-payment.use-case'
import { UpdateChargeUseCase } from './application/use-cases/update-charge.use-case'
import { PrismaChargeRepository } from './infrastructure/prisma-charge.repository'

const chargeRepository = new PrismaChargeRepository()

export const financialContainer = {
  createChargeUseCase: new CreateChargeUseCase(chargeRepository),
  listChargesUseCase: new ListChargesUseCase(chargeRepository),
  getChargeUseCase: new GetChargeUseCase(chargeRepository),
  updateChargeUseCase: new UpdateChargeUseCase(chargeRepository),
  registerChargePaymentUseCase: new RegisterChargePaymentUseCase(chargeRepository),
  getFinancialSummaryUseCase: new GetFinancialSummaryUseCase(chargeRepository),
}

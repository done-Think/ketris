import { CancelChargeUseCase } from './application/use-cases/cancel-charge.use-case'
import { CreateChargeUseCase } from './application/use-cases/create-charge.use-case'
import { DeleteChargeUseCase } from './application/use-cases/delete-charge.use-case'
import { DownloadChargeReceiptUseCase } from './application/use-cases/download-charge-receipt.use-case'
import { ExportChargesUseCase } from './application/use-cases/export-charges.use-case'
import { GetChargeUseCase } from './application/use-cases/get-charge.use-case'
import { GetFinancialSummaryUseCase } from './application/use-cases/get-financial-summary.use-case'
import { InitChargeReceiptUploadUseCase } from './application/use-cases/init-charge-receipt-upload.use-case'
import { ListChargeHistoryUseCase } from './application/use-cases/list-charge-history.use-case'
import { ListChargesUseCase } from './application/use-cases/list-charges.use-case'
import { RegisterChargePaymentUseCase } from './application/use-cases/register-charge-payment.use-case'
import { ReverseChargePaymentUseCase } from './application/use-cases/reverse-charge-payment.use-case'
import { UpdateChargeUseCase } from './application/use-cases/update-charge.use-case'
import { JoseChargeReceiptUploadTickets } from './infrastructure/jose-charge-receipt-upload-tickets'
import { PrismaChargeRepository } from './infrastructure/prisma-charge.repository'
import { S3ChargeReceiptStorage } from './infrastructure/s3-charge-receipt-storage'
import { UuidChargeReceiptIds } from './infrastructure/uuid-charge-receipt-ids'

const chargeRepository = new PrismaChargeRepository()
const receiptStorage = new S3ChargeReceiptStorage()
const receiptTickets = new JoseChargeReceiptUploadTickets()

export const financialContainer = {
  createChargeUseCase: new CreateChargeUseCase(chargeRepository),
  listChargesUseCase: new ListChargesUseCase(chargeRepository),
  getChargeUseCase: new GetChargeUseCase(chargeRepository),
  updateChargeUseCase: new UpdateChargeUseCase(chargeRepository),
  deleteChargeUseCase: new DeleteChargeUseCase(chargeRepository),
  cancelChargeUseCase: new CancelChargeUseCase(chargeRepository),
  reverseChargePaymentUseCase: new ReverseChargePaymentUseCase(chargeRepository),
  listChargeHistoryUseCase: new ListChargeHistoryUseCase(chargeRepository),
  registerChargePaymentUseCase: new RegisterChargePaymentUseCase(
    chargeRepository,
    receiptStorage,
    receiptTickets,
  ),
  initChargeReceiptUploadUseCase: new InitChargeReceiptUploadUseCase(
    chargeRepository,
    receiptStorage,
    receiptTickets,
    new UuidChargeReceiptIds(),
  ),
  downloadChargeReceiptUseCase: new DownloadChargeReceiptUseCase(chargeRepository, receiptStorage),
  getFinancialSummaryUseCase: new GetFinancialSummaryUseCase(chargeRepository),
  exportChargesUseCase: new ExportChargesUseCase(chargeRepository),
}

import { InitContractDocumentUploadUseCase } from './application/use-cases/init-contract-document-upload.use-case'
import { ConfirmContractDocumentUploadUseCase } from './application/use-cases/confirm-contract-document-upload.use-case'
import { DownloadContractDocumentUseCase } from './application/use-cases/download-contract-document.use-case'
import { PrismaContractDocumentRepository } from './infrastructure/prisma-contract-document.repository'
import { S3ContractDocumentStorage } from './infrastructure/s3-contract-document-storage'
import { JoseContractUploadTickets } from './infrastructure/jose-contract-upload-tickets'
import { UuidContractDocumentIds } from './infrastructure/uuid-contract-document-ids'
import type { Prisma } from '@prisma/client'
import { PrismaContractPartyLinkTransaction } from './infrastructure/prisma-contract-party-link-transaction'
import { CreateContractFromOpportunityUseCase } from './application/use-cases/create-contract-from-opportunity.use-case'
import { GetContractUseCase } from './application/use-cases/get-contract.use-case'
import { ListContractsUseCase } from './application/use-cases/list-contracts.use-case'
import { LinkContractPartyUserUseCase } from './application/use-cases/link-contract-party-user.use-case'
import { SignContractPartyUseCase } from './application/use-cases/sign-contract-party.use-case'
import { PrismaContractRepository } from './infrastructure/prisma-contract.repository'
import { AesContractDataProtector } from './infrastructure/aes-contract-data-protector'
import { PrismaContractOpportunityCatalog } from './infrastructure/prisma-contract-opportunity-catalog'
import { PrismaContractWorkflowRepository } from './infrastructure/prisma-contract-workflow.repository'
import { EditContractUseCase } from './application/use-cases/edit-contract.use-case'
import { TransitionContractUseCase } from './application/use-cases/transition-contract.use-case'
import { ListContractHistoryUseCase } from './application/use-cases/list-contract-history.use-case'
import { ListContractOpportunitiesUseCase } from './application/use-cases/list-contract-opportunities.use-case'

const contractRepository = new PrismaContractRepository(new AesContractDataProtector())
const workflowRepository = new PrismaContractWorkflowRepository(new AesContractDataProtector())

const documentRepository = new PrismaContractDocumentRepository()
const documentStorage = new S3ContractDocumentStorage()
const uploadTickets = new JoseContractUploadTickets()

export const contractsContainer = {
  initContractDocumentUploadUseCase: new InitContractDocumentUploadUseCase(
    documentRepository,
    documentStorage,
    uploadTickets,
    new UuidContractDocumentIds(),
  ),
  confirmContractDocumentUploadUseCase: new ConfirmContractDocumentUploadUseCase(
    documentRepository,
    documentStorage,
    uploadTickets,
  ),
  downloadContractDocumentUseCase: new DownloadContractDocumentUseCase(
    documentRepository,
    documentStorage,
  ),
  editContractUseCase: new EditContractUseCase(workflowRepository),
  transitionContractUseCase: new TransitionContractUseCase(workflowRepository),
  listContractHistoryUseCase: new ListContractHistoryUseCase(workflowRepository),
  createContractPartyLinkUseCase: (tx: Prisma.TransactionClient) =>
    new LinkContractPartyUserUseCase(new PrismaContractPartyLinkTransaction(tx)),
  listContractOpportunitiesUseCase: new ListContractOpportunitiesUseCase(
    new PrismaContractOpportunityCatalog(),
  ),
  createContractFromOpportunityUseCase: new CreateContractFromOpportunityUseCase(
    contractRepository,
  ),
  listContractsUseCase: new ListContractsUseCase(contractRepository),
  getContractUseCase: new GetContractUseCase(contractRepository),
  signContractPartyUseCase: new SignContractPartyUseCase(contractRepository),
  linkContractPartyUserUseCase: new LinkContractPartyUserUseCase(
    new PrismaContractPartyLinkTransaction(),
  ),
}

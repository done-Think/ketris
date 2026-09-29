import { CreateContractFromOpportunityUseCase } from './application/use-cases/create-contract-from-opportunity.use-case'
import { GetContractUseCase } from './application/use-cases/get-contract.use-case'
import { ListContractsUseCase } from './application/use-cases/list-contracts.use-case'
import { SignContractPartyUseCase } from './application/use-cases/sign-contract-party.use-case'
import { PrismaContractRepository } from './infrastructure/prisma-contract.repository'

const contractRepository = new PrismaContractRepository()

export const contractsContainer = {
  createContractFromOpportunityUseCase: new CreateContractFromOpportunityUseCase(
    contractRepository,
  ),
  listContractsUseCase: new ListContractsUseCase(contractRepository),
  getContractUseCase: new GetContractUseCase(contractRepository),
  signContractPartyUseCase: new SignContractPartyUseCase(contractRepository),
}

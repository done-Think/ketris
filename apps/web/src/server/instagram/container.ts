import { ListInstagramPublicationsUseCase } from './application/use-cases/list-instagram-publications.use-case'
import { RetryInstagramPublicationUseCase } from './application/use-cases/retry-instagram-publication.use-case'
import { ConnectInstagramUseCase } from './application/use-cases/connect-instagram.use-case'
import { QueueInstagramPublicationUseCase } from './application/use-cases/queue-instagram-publication.use-case'
import { ProcessInstagramPublicationUseCase } from './application/use-cases/process-instagram-publication.use-case'
import { MetaInstagramApi } from './infrastructure/meta-instagram-api'
import { PrismaInstagramRepository } from './infrastructure/prisma-instagram.repository'
import { EncryptedInstagramTokenVault } from './infrastructure/token-vault'
import { S3InstagramMedia } from './infrastructure/s3-instagram-media'
import { DeleteInstagramDataUseCase } from './application/use-cases/delete-instagram-data.use-case'

const repository = new PrismaInstagramRepository()
const api = new MetaInstagramApi()
const vault = new EncryptedInstagramTokenVault()
const media = new S3InstagramMedia()
export const instagramContainer = {
  repository,
  list: new ListInstagramPublicationsUseCase(repository),
  retry: new RetryInstagramPublicationUseCase(repository),
  connect: new ConnectInstagramUseCase(repository, api, vault),
  queue: new QueueInstagramPublicationUseCase(repository, vault),
  process: new ProcessInstagramPublicationUseCase(repository, api, vault, media),
  deleteData: new DeleteInstagramDataUseCase(repository, media),
}
